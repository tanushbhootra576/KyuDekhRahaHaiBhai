const express = require('express');
const { body } = require('express-validator');
const issueController = require('../controllers/issue.controller');
const { authenticate, authorizeGovernment, authorizeCitizen } = require('../middlewares/auth.middleware');
const { issueUpload, resolutionImages, handleUploadErrors } = require('../middlewares/upload.middleware');

const router = express.Router();

// Create issue route (citizen only)
router.post(
    '/',
    authenticate,
    authorizeCitizen,
    issueUpload,
    handleUploadErrors,
    [
        body('title').not().isEmpty().withMessage('Title is required'),
        body('description').not().isEmpty().withMessage('Description is required'),
        body('category').isIn([
            'pothole', 'garbage', 'streetlight', 'water', 'electricity', 'sewage', 'traffic', 'vandalism', 'other'
        ]).withMessage('Invalid category'),
        body('location.latitude').isFloat().withMessage('Valid latitude is required'),
        body('location.longitude').isFloat().withMessage('Valid longitude is required'),
        body('location.address').not().isEmpty().withMessage('Address is required')
    ],
    issueController.createIssue
);

// Get all issues route (with filters)
router.get('/', authenticate, issueController.getIssues);

// Get issue by ID route
router.get('/:id', authenticate, issueController.getIssueById);

// Update issue status route (government only)
router.put(
    '/:id/status',
    authenticate,
    authorizeGovernment,
    [
        body('status').isIn(['submitted', 'in-progress', 'resolved', 'rejected']).withMessage('Invalid status')
    ],
    issueController.updateIssueStatus
);

// Assign issue route (government only)
router.put(
    '/:id/assign',
    authenticate,
    authorizeGovernment,
    [
        body('department').not().isEmpty().withMessage('Department is required')
    ],
    issueController.assignIssue
);

// Upvote issue route (citizen only)
router.post(
    '/:id/upvote',
    authenticate,
    authorizeCitizen,
    issueController.upvoteIssue
);

// Add resolution proof route (government only)
router.post(
    '/:id/resolution',
    authenticate,
    authorizeGovernment,
    resolutionImages,
    handleUploadErrors,
    issueController.addResolutionProof
);

// Get user's reported issues route
router.get('/user/me', authenticate, issueController.getUserIssues);

// Get nearby issues route
router.get('/nearby', authenticate, issueController.getNearbyIssues);

module.exports = router;
