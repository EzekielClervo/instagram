const express = require('express');
const router = express.Router();
const igAutomation = require('./instagram-automation');

// Helper middleware for authentication
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

// Automation Endpoints
router.post("/run", isAuthenticated, async (req, res) => {
  try {
    const { type, username, postUrl, commentText, commentId, count = 1 } = req.body;
    
    // Get the user's cookies to run the automation
    const cookies = await req.app.locals.storage.getCookiesByUserId(req.user.id);
    if (!cookies || cookies.length === 0) {
      return res.status(400).json({ message: "No cookies available. Please add an account first." });
    }
    
    let result = { success: false, message: "Unknown automation type" };
    const cookieValue = cookies[0].cookieValue;
    
    // Create activity log entry
    const logEntry = {
      userId: req.user.id,
      type,
      accountUsername: username || "Unknown",
      action: "Pending",
      status: "pending",
    };
    
    // Handle different automation types
    switch (type) {
      case "follow":
        if (!username) {
          return res.status(400).json({ message: "Username is required" });
        }
        logEntry.action = `Followed @${username}`;
        const activityLogFollow = await req.app.locals.storage.createActivityLog(logEntry);
        
        result = await igAutomation.followUser(username, cookieValue);
        await req.app.locals.storage.updateActivityLog(activityLogFollow.id, {
          status: result.success ? "success" : "failed"
        });
        break;
        
      case "unfollow":
        if (!username) {
          return res.status(400).json({ message: "Username is required" });
        }
        logEntry.action = `Unfollowed @${username}`;
        const activityLogUnfollow = await req.app.locals.storage.createActivityLog(logEntry);
        
        result = await igAutomation.unfollowUser(username, cookieValue);
        await req.app.locals.storage.updateActivityLog(activityLogUnfollow.id, {
          status: result.success ? "success" : "failed"
        });
        break;
        
      case "like":
        if (!postUrl) {
          return res.status(400).json({ message: "Post URL is required" });
        }
        logEntry.action = `Liked post: ${postUrl}`;
        const activityLogLike = await req.app.locals.storage.createActivityLog(logEntry);
        
        result = await igAutomation.likePost(postUrl, cookieValue);
        await req.app.locals.storage.updateActivityLog(activityLogLike.id, {
          status: result.success ? "success" : "failed"
        });
        break;
        
      case "unlike":
        if (!postUrl) {
          return res.status(400).json({ message: "Post URL is required" });
        }
        logEntry.action = `Unliked post: ${postUrl}`;
        const activityLogUnlike = await req.app.locals.storage.createActivityLog(logEntry);
        
        result = await igAutomation.unlikePost(postUrl, cookieValue);
        await req.app.locals.storage.updateActivityLog(activityLogUnlike.id, {
          status: result.success ? "success" : "failed"
        });
        break;
        
      case "comment":
        if (!postUrl || !commentText) {
          return res.status(400).json({ message: "Post URL and comment text are required" });
        }
        logEntry.action = `Commented on post: ${postUrl}`;
        const activityLogComment = await req.app.locals.storage.createActivityLog(logEntry);
        
        result = await igAutomation.commentPost(postUrl, commentText, cookieValue);
        await req.app.locals.storage.updateActivityLog(activityLogComment.id, {
          status: result.success ? "success" : "failed"
        });
        break;
        
      case "delete_comment":
        if (!commentId) {
          return res.status(400).json({ message: "Comment ID is required" });
        }
        logEntry.action = `Deleted comment: ${commentId}`;
        const activityLogDeleteComment = await req.app.locals.storage.createActivityLog(logEntry);
        
        result = await igAutomation.deleteComment(postUrl || "", commentId, cookieValue);
        await req.app.locals.storage.updateActivityLog(activityLogDeleteComment.id, {
          status: result.success ? "success" : "failed"
        });
        break;
        
      case "profile_info":
        if (!username) {
          return res.status(400).json({ message: "Username is required" });
        }
        logEntry.action = `Retrieved profile info: @${username}`;
        const activityLogProfile = await req.app.locals.storage.createActivityLog(logEntry);
        
        result = await igAutomation.getInstagramProfileInfo(username, cookieValue);
        await req.app.locals.storage.updateActivityLog(activityLogProfile.id, {
          status: result.success ? "success" : "failed"
        });
        break;
        
      case "duplicates":
        logEntry.action = "Removed duplicate accounts";
        const activityLogDuplicates = await req.app.locals.storage.createActivityLog(logEntry);
        
        result = await igAutomation.removeDuplicateAccounts(cookieValue);
        await req.app.locals.storage.updateActivityLog(activityLogDuplicates.id, {
          status: result.success ? "success" : "failed"
        });
        break;
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error running automation", 
      error: error.message 
    });
  }
});

module.exports = router;
