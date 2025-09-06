const Issue = require('../models/Issue');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const { io } = require('../index');

// Helper function to determine issue priority based on category and votes
const calculatePriority = (category, votes = 0) => {
    // Base priorities for different categories
    const categoryPriorities = {
        'pothole': 2, // medium
        'garbage': 1, // low
        'streetlight': 1, // low
        'water': 3, // high
        'electricity': 3, // high
        'sewage': 2, // medium
        'traffic': 2, // medium
        'vandalism': 1, // low
        'other': 1 // low
    };

    // Get base priority from category
    let priorityLevel = categoryPriorities[category] || 1;

    // Adjust based on votes
    if (votes >= 20) {
        priorityLevel = 4; // urgent
    } else if (votes >= 10) {
        priorityLevel = 3; // high
    } else if (votes >= 5) {
        priorityLevel = 2; // medium
    }

    // Map priority level to string
    const priorityMap = {
        1: 'low',
        2: 'medium',
        3: 'high',
        4: 'urgent'
    };

    return priorityMap[priorityLevel];
};

// Helper function to determine department based on issue category
const determineAssignedDepartment = (category) => {
    const departmentMap = {
        'pothole': 'Roads & Transportation',
        'garbage': 'Waste Management',
        'streetlight': 'Electricity',
        'water': 'Water Supply',
        'electricity': 'Electricity',
        'sewage': 'Sanitation',
        'traffic': 'Traffic Police',
        'vandalism': 'Municipal Administration',
        'other': 'General Administration'
    };

    return departmentMap[category] || 'General Administration';
};

module.exports = {
    // Create a new issue
    createIssue: async (req, res) => {
        try {
            // Validate request
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { title, description, category, location } = req.body;

            // Check if files were uploaded
            if (!req.files || !req.files.images || !req.files.images.length) {
                return res.status(400).json({ message: 'At least one image is required' });
            }

            // Process images
            const imagesPaths = req.files.images.map(file => `/uploads/images/${file.filename}`);

            // Process voice note if provided
            let voiceNotePath = null;
            if (req.files.voiceNote && req.files.voiceNote.length > 0) {
                voiceNotePath = `/uploads/audio/${req.files.voiceNote[0].filename}`;
            }

            // Parse coordinates
            const coordinates = [
                parseFloat(location.longitude),
                parseFloat(location.latitude)
            ];

            // Determine initial priority based on category
            const priority = calculatePriority(category);

            // Determine department
            const department = determineAssignedDepartment(category);

            // Create new issue
            const issue = new Issue({
                title,
                description,
                category,
                location: {
                    type: 'Point',
                    coordinates,
                    address: location.address,
                    city: location.city,
                    state: location.state,
                    pincode: location.pincode
                },
                images: imagesPaths,
                voiceNote: voiceNotePath,
                reportedBy: req.user.id,
                assignedTo: {
                    department
                },
                priority,
                statusHistory: [{
                    status: 'submitted',
                    updatedBy: req.user.id,
                    comment: 'Issue reported',
                    timestamp: Date.now()
                }]
            });

            await issue.save();

            // Award points to user
            const user = await User.findById(req.user.id);
            user.points += 5; // 5 points for reporting an issue
            await user.save();

            // Create notification for the user
            const notification = new Notification({
                recipient: req.user.id,
                title: 'Issue Submitted',
                message: `Your issue "${title}" has been submitted successfully and assigned to ${department}.`,
                type: 'issue-submission',
                relatedIssue: issue._id
            });

            await notification.save();

            // Emit socket event for real-time updates
            io.emit('newIssue', {
                issue: await Issue.findById(issue._id).populate('reportedBy', 'name profilePicture')
            });

            res.status(201).json({
                message: 'Issue reported successfully',
                issue,
                points: 5
            });
        } catch (error) {
            console.error('Create issue error:', error);
            res.status(500).json({ message: 'Server error while creating issue' });
        }
    },

    // Get all issues with filters
    getIssues: async (req, res) => {
        try {
            const {
                status,
                category,
                priority,
                city,
                state,
                department,
                lat,
                lng,
                radius = 5000, // Default 5km radius
                startDate,
                endDate,
                sortBy = 'createdAt',
                sortOrder = 'desc',
                page = 1,
                limit = 10
            } = req.query;

            // Build query
            const query = {};

            // Status filter
            if (status) {
                query.status = status;
            }

            // Category filter
            if (category) {
                query.category = category;
            }

            // Priority filter
            if (priority) {
                query.priority = priority;
            }

            // Location filters
            if (city) {
                query['location.city'] = city;
            }

            if (state) {
                query['location.state'] = state;
            }

            // Department filter
            if (department) {
                query['assignedTo.department'] = department;
            }

            // Date range filter
            if (startDate || endDate) {
                query.createdAt = {};

                if (startDate) {
                    query.createdAt.$gte = new Date(startDate);
                }

                if (endDate) {
                    query.createdAt.$lte = new Date(endDate);
                }
            }

            // Geospatial filter
            if (lat && lng) {
                query['location.coordinates'] = {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [parseFloat(lng), parseFloat(lat)]
                        },
                        $maxDistance: parseInt(radius)
                    }
                };
            }

            // Pagination
            const skip = (parseInt(page) - 1) * parseInt(limit);

            // Sort options
            const sortOptions = {};
            sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

            // Execute query
            const issues = await Issue.find(query)
                .populate('reportedBy', 'name profilePicture')
                .populate('assignedTo.official', 'name department')
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit));

            // Get total count for pagination
            const total = await Issue.countDocuments(query);

            res.json({
                issues,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(total / parseInt(limit))
                }
            });
        } catch (error) {
            console.error('Get issues error:', error);
            res.status(500).json({ message: 'Server error while fetching issues' });
        }
    },

    // Get issue by ID
    getIssueById: async (req, res) => {
        try {
            const issue = await Issue.findById(req.params.id)
                .populate('reportedBy', 'name profilePicture')
                .populate('assignedTo.official', 'name department')
                .populate('statusHistory.updatedBy', 'name role department')
                .populate('resolutionDetails.resolvedBy', 'name department');

            if (!issue) {
                return res.status(404).json({ message: 'Issue not found' });
            }

            res.json(issue);
        } catch (error) {
            console.error('Get issue by ID error:', error);
            res.status(500).json({ message: 'Server error while fetching issue' });
        }
    },

    // Update issue status (government officials only)
    updateIssueStatus: async (req, res) => {
        try {
            const { status, comment } = req.body;

            // Find issue
            const issue = await Issue.findById(req.params.id);

            if (!issue) {
                return res.status(404).json({ message: 'Issue not found' });
            }

            // Update status
            issue.status = status;

            // Add to status history
            issue.statusHistory.push({
                status,
                updatedBy: req.user.id,
                comment: comment || `Status updated to ${status}`,
                timestamp: Date.now()
            });

            // If resolved, add resolution details
            if (status === 'resolved') {
                issue.resolutionDetails = {
                    resolvedBy: req.user.id,
                    resolutionDate: Date.now(),
                    resolutionDescription: comment || 'Issue resolved'
                };

                // Award points to reporter
                const reporter = await User.findById(issue.reportedBy);
                if (reporter) {
                    reporter.points += 10; // 10 points for getting issue resolved

                    // Check if eligible for badge
                    const resolvedIssues = await Issue.countDocuments({
                        reportedBy: reporter._id,
                        status: 'resolved'
                    });

                    if (resolvedIssues >= 5 && !reporter.badges.some(badge => badge.name === 'Civic Champion')) {
                        reporter.badges.push({
                            name: 'Civic Champion',
                            description: 'Successfully reported and got 5 issues resolved',
                            awardedOn: Date.now()
                        });
                    }

                    await reporter.save();
                }
            }

            await issue.save();

            // Create notification for the reporter
            const notification = new Notification({
                recipient: issue.reportedBy,
                title: `Issue ${status === 'resolved' ? 'Resolved' : 'Updated'}`,
                message: status === 'resolved'
                    ? `Your reported issue "${issue.title}" has been resolved.`
                    : `The status of your issue "${issue.title}" has been updated to ${status}.`,
                type: 'status-update',
                relatedIssue: issue._id
            });

            await notification.save();

            // Emit socket event for real-time updates
            io.emit('statusChange', {
                issue: await Issue.findById(issue._id)
                    .populate('reportedBy', 'name profilePicture')
                    .populate('assignedTo.official', 'name department')
            });

            res.json({
                message: `Issue status updated to ${status}`,
                issue
            });
        } catch (error) {
            console.error('Update issue status error:', error);
            res.status(500).json({ message: 'Server error while updating issue status' });
        }
    },

    // Assign issue to an official (government officials only)
    assignIssue: async (req, res) => {
        try {
            const { department, officialId } = req.body;

            // Find issue
            const issue = await Issue.findById(req.params.id);

            if (!issue) {
                return res.status(404).json({ message: 'Issue not found' });
            }

            // Update assignment
            issue.assignedTo = {
                department: department || issue.assignedTo.department,
                official: officialId || issue.assignedTo.official
            };

            // Add to status history
            issue.statusHistory.push({
                status: issue.status,
                updatedBy: req.user.id,
                comment: `Issue assigned to ${department} department${officialId ? ' and official' : ''}`,
                timestamp: Date.now()
            });

            await issue.save();

            // Create notification for the assigned official
            if (officialId) {
                const notification = new Notification({
                    recipient: officialId,
                    title: 'New Issue Assigned',
                    message: `An issue "${issue.title}" has been assigned to you.`,
                    type: 'assignment',
                    relatedIssue: issue._id
                });

                await notification.save();
            }

            // Emit socket event for real-time updates
            io.emit('issueAssigned', {
                issue: await Issue.findById(issue._id)
                    .populate('reportedBy', 'name profilePicture')
                    .populate('assignedTo.official', 'name department')
            });

            res.json({
                message: 'Issue assigned successfully',
                issue
            });
        } catch (error) {
            console.error('Assign issue error:', error);
            res.status(500).json({ message: 'Server error while assigning issue' });
        }
    },

    // Upvote an issue (citizens only)
    upvoteIssue: async (req, res) => {
        try {
            // Find issue
            const issue = await Issue.findById(req.params.id);

            if (!issue) {
                return res.status(404).json({ message: 'Issue not found' });
            }

            // Check if user already voted
            if (issue.voters.includes(req.user.id)) {
                return res.status(400).json({ message: 'You have already upvoted this issue' });
            }

            // Add vote
            issue.votes += 1;
            issue.voters.push(req.user.id);

            // Recalculate priority based on votes
            issue.priority = calculatePriority(issue.category, issue.votes);

            await issue.save();

            // Award points to voter
            const user = await User.findById(req.user.id);
            user.points += 2; // 2 points for upvoting
            await user.save();

            // Create notification for the reporter
            const notification = new Notification({
                recipient: issue.reportedBy,
                title: 'Issue Upvoted',
                message: `Your reported issue "${issue.title}" received a new upvote.`,
                type: 'upvote',
                relatedIssue: issue._id
            });

            await notification.save();

            // Emit socket event for real-time updates
            io.emit('issueUpvoted', {
                issueId: issue._id,
                votes: issue.votes,
                priority: issue.priority
            });

            res.json({
                message: 'Issue upvoted successfully',
                issue: {
                    _id: issue._id,
                    votes: issue.votes,
                    priority: issue.priority
                },
                points: 2
            });
        } catch (error) {
            console.error('Upvote issue error:', error);
            res.status(500).json({ message: 'Server error while upvoting issue' });
        }
    },

    // Add resolution proof (government officials only)
    addResolutionProof: async (req, res) => {
        try {
            const { resolutionDescription } = req.body;

            // Find issue
            const issue = await Issue.findById(req.params.id);

            if (!issue) {
                return res.status(404).json({ message: 'Issue not found' });
            }

            // Check if issue is in a valid state
            if (issue.status !== 'in-progress' && issue.status !== 'resolved') {
                return res.status(400).json({
                    message: 'Resolution proof can only be added to in-progress or resolved issues'
                });
            }

            // Process resolution images
            const resolutionImages = req.files.map(file => `/uploads/images/${file.filename}`);

            // Update resolution details
            issue.resolutionDetails = {
                ...issue.resolutionDetails,
                resolvedBy: req.user.id,
                resolutionDate: Date.now(),
                resolutionImages: resolutionImages,
                resolutionDescription: resolutionDescription || issue.resolutionDetails?.resolutionDescription || 'Issue resolved'
            };

            // If not already resolved, update status
            if (issue.status !== 'resolved') {
                issue.status = 'resolved';

                // Add to status history
                issue.statusHistory.push({
                    status: 'resolved',
                    updatedBy: req.user.id,
                    comment: resolutionDescription || 'Issue resolved with proof',
                    timestamp: Date.now()
                });
            }

            await issue.save();

            // Create notification for the reporter
            const notification = new Notification({
                recipient: issue.reportedBy,
                title: 'Issue Resolved with Proof',
                message: `Your reported issue "${issue.title}" has been resolved. Check the resolution proof.`,
                type: 'resolution',
                relatedIssue: issue._id
            });

            await notification.save();

            // Emit socket event for real-time updates
            io.emit('issueResolved', {
                issue: await Issue.findById(issue._id)
                    .populate('reportedBy', 'name profilePicture')
                    .populate('resolutionDetails.resolvedBy', 'name department')
            });

            res.json({
                message: 'Resolution proof added successfully',
                issue
            });
        } catch (error) {
            console.error('Add resolution proof error:', error);
            res.status(500).json({ message: 'Server error while adding resolution proof' });
        }
    },

    // Get user's reported issues
    getUserIssues: async (req, res) => {
        try {
            const { status, page = 1, limit = 10 } = req.query;

            // Build query
            const query = { reportedBy: req.user.id };

            // Status filter
            if (status) {
                query.status = status;
            }

            // Pagination
            const skip = (parseInt(page) - 1) * parseInt(limit);

            // Execute query
            const issues = await Issue.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit));

            // Get total count for pagination
            const total = await Issue.countDocuments(query);

            // Get counts by status
            const statusCounts = await Issue.aggregate([
                { $match: { reportedBy: req.user._id } },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]);

            // Format counts
            const counts = {
                submitted: 0,
                'in-progress': 0,
                resolved: 0,
                rejected: 0
            };

            statusCounts.forEach(item => {
                counts[item._id] = item.count;
            });

            res.json({
                issues,
                counts,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(total / parseInt(limit))
                }
            });
        } catch (error) {
            console.error('Get user issues error:', error);
            res.status(500).json({ message: 'Server error while fetching user issues' });
        }
    },

    // Get nearby issues
    getNearbyIssues: async (req, res) => {
        try {
            const { lat, lng, radius = 5000, page = 1, limit = 10 } = req.query;

            if (!lat || !lng) {
                return res.status(400).json({ message: 'Latitude and longitude are required' });
            }

            // Pagination
            const skip = (parseInt(page) - 1) * parseInt(limit);

            // Execute geospatial query
            const issues = await Issue.find({
                'location.coordinates': {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [parseFloat(lng), parseFloat(lat)]
                        },
                        $maxDistance: parseInt(radius)
                    }
                }
            })
                .populate('reportedBy', 'name profilePicture')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit));

            // Get total count
            const total = await Issue.countDocuments({
                'location.coordinates': {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [parseFloat(lng), parseFloat(lat)]
                        },
                        $maxDistance: parseInt(radius)
                    }
                }
            });

            res.json({
                issues,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(total / parseInt(limit))
                }
            });
        } catch (error) {
            console.error('Get nearby issues error:', error);
            res.status(500).json({ message: 'Server error while fetching nearby issues' });
        }
    }
};
