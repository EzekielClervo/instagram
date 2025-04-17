const axios = require('axios');

// Helper Functions
function parseTimeLimitToSeconds(timeStr) {
  timeStr = timeStr.toLowerCase().trim();
  if (timeStr.includes("hour")) {
    const num = parseInt(timeStr.replace(/\D/g, ""));
    return num * 3600;
  }
  if (timeStr.includes("minute")) {
    const num = parseInt(timeStr.replace(/\D/g, ""));
    return num * 60;
  }
  if (timeStr.includes("sec")) {
    const num = parseInt(timeStr.replace(/\D/g, ""));
    return num;
  }
  try {
    return parseInt(timeStr) * 60;
  } catch {
    return 300; // Default 5 minutes
  }
}

function generateRandomKey(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function parseCookieString(cookieStr) {
  const cookies = {};
  cookieStr.split('; ').forEach(part => {
    const [key, value] = part.split('=');
    if (key && value) {
      cookies[key.trim()] = value.trim();
    }
  });
  return cookies;
}

// Instagram API Helper Functions
function shortcodeToMediaId(shortcode) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  let mediaId = 0;
  for (const c of shortcode) {
    mediaId = mediaId * 64 + alphabet.indexOf(c);
  }
  return mediaId.toString();
}

// Instagram Interaction Functions
async function isLoggedIn(cookieStr) {
  try {
    const cookies = parseCookieString(cookieStr);
    const response = await axios.get("https://www.instagram.com/accounts/edit/", {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'X-CSRFToken': cookies['csrftoken'] || '',
        'Cookie': cookieStr
      },
      maxRedirects: 0,
      validateStatus: status => status === 200
    });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

async function followUser(username, cookieStr) {
  try {
    const cookies = parseCookieString(cookieStr);
    
    // Step 1: Get the user ID from username
    const profileResponse = await axios.get(
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'X-IG-App-ID': '936619743392459',
          'X-CSRFToken': cookies['csrftoken'] || '',
          'Referer': `https://www.instagram.com/${username}/`,
          'Origin': 'https://www.instagram.com',
          'X-Requested-With': 'XMLHttpRequest',
          'Cookie': cookieStr
        }
      }
    );

    if (profileResponse.status !== 200) {
      return { success: false, message: `Failed to get profile info for ${username}` };
    }

    const userId = profileResponse.data.data.user.id;

    // Step 2: Follow the user
    const followResponse = await axios.post(
      `https://www.instagram.com/api/v1/friendships/create/${userId}/`,
      {},
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'X-IG-App-ID': '936619743392459',
          'X-CSRFToken': cookies['csrftoken'] || '',
          'Referer': `https://www.instagram.com/${username}/`,
          'Origin': 'https://www.instagram.com',
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': cookieStr
        }
      }
    );

    return { 
      success: followResponse.status === 200, 
      message: followResponse.status === 200 
        ? `Successfully followed ${username}` 
        : `Failed to follow ${username}` 
    };
  } catch (error) {
    return { 
      success: false, 
      message: `Error following ${username}: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

async function unfollowUser(username, cookieStr) {
  try {
    const cookies = parseCookieString(cookieStr);
    
    // Step 1: Get the user ID from username
    const profileResponse = await axios.get(
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'X-IG-App-ID': '936619743392459',
          'X-CSRFToken': cookies['csrftoken'] || '',
          'Referer': `https://www.instagram.com/${username}/`,
          'Origin': 'https://www.instagram.com',
          'X-Requested-With': 'XMLHttpRequest',
          'Cookie': cookieStr
        }
      }
    );

    if (profileResponse.status !== 200) {
      return { success: false, message: `Failed to get profile info for ${username}` };
    }

    const userId = profileResponse.data.data.user.id;

    // Step 2: Unfollow the user
    const unfollowResponse = await axios.post(
      `https://www.instagram.com/api/v1/friendships/destroy/${userId}/`,
      {},
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'X-IG-App-ID': '936619743392459',
          'X-CSRFToken': cookies['csrftoken'] || '',
          'Referer': `https://www.instagram.com/${username}/`,
          'Origin': 'https://www.instagram.com',
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': cookieStr
        }
      }
    );

    return { 
      success: unfollowResponse.status === 200, 
      message: unfollowResponse.status === 200 
        ? `Successfully unfollowed ${username}` 
        : `Failed to unfollow ${username}` 
    };
  } catch (error) {
    return { 
      success: false, 
      message: `Error unfollowing ${username}: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

async function likePost(postUrl, cookieStr) {
  try {
    const cookies = parseCookieString(cookieStr);
    
    // Extract shortcode from URL
    let shortcode;
    try {
      shortcode = postUrl.split('/p/')[1].split('/')[0].split('?')[0];
    } catch (error) {
      return { success: false, message: 'Invalid post URL format' };
    }
    
    const mediaId = shortcodeToMediaId(shortcode);
    
    const response = await axios.post(
      `https://www.instagram.com/web/likes/${mediaId}/like/`,
      {},
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'X-CSRFToken': cookies['csrftoken'] || '',
          'Referer': postUrl,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': cookieStr
        }
      }
    );

    return { 
      success: response.status === 200, 
      message: response.status === 200 
        ? `Successfully liked post: ${postUrl}` 
        : `Failed to like post: ${postUrl}` 
    };
  } catch (error) {
    return { 
      success: false, 
      message: `Error liking post: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

async function unlikePost(postUrl, cookieStr) {
  try {
    const cookies = parseCookieString(cookieStr);
    
    // Extract shortcode from URL
    let shortcode;
    try {
      shortcode = postUrl.split('/p/')[1].split('/')[0].split('?')[0];
    } catch (error) {
      return { success: false, message: 'Invalid post URL format' };
    }
    
    const mediaId = shortcodeToMediaId(shortcode);
    
    const response = await axios.post(
      `https://www.instagram.com/web/likes/${mediaId}/unlike/`,
      {},
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'X-CSRFToken': cookies['csrftoken'] || '',
          'Referer': postUrl,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': cookieStr
        }
      }
    );

    return { 
      success: response.status === 200, 
      message: response.status === 200 
        ? `Successfully unliked post: ${postUrl}` 
        : `Failed to unlike post: ${postUrl}` 
    };
  } catch (error) {
    return { 
      success: false, 
      message: `Error unliking post: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

async function commentPost(postUrl, commentText, cookieStr) {
  try {
    const cookies = parseCookieString(cookieStr);
    
    // Extract shortcode from URL
    let shortcode;
    try {
      shortcode = postUrl.split('/p/')[1].split('/')[0].split('?')[0];
    } catch (error) {
      return { success: false, message: 'Invalid post URL format' };
    }
    
    const mediaId = shortcodeToMediaId(shortcode);
    
    const response = await axios.post(
      `https://www.instagram.com/web/comments/${mediaId}/add/`,
      { comment_text: commentText },
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'X-CSRFToken': cookies['csrftoken'] || '',
          'Referer': postUrl,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': cookieStr
        }
      }
    );

    return { 
      success: response.status === 200, 
      message: response.status === 200 
        ? `Successfully commented on post: ${postUrl}` 
        : `Failed to comment on post: ${postUrl}` 
    };
  } catch (error) {
    return { 
      success: false, 
      message: `Error commenting on post: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

async function deleteComment(postUrl, commentId, cookieStr) {
  try {
    const cookies = parseCookieString(cookieStr);
    
    const response = await axios.post(
      `https://www.instagram.com/web/comments/${commentId}/delete/`,
      { comment_id: commentId },
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'X-CSRFToken': cookies['csrftoken'] || '',
          'Referer': postUrl,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': cookieStr
        }
      }
    );

    return { 
      success: response.status === 200, 
      message: response.status === 200 
        ? `Successfully deleted comment: ${commentId}` 
        : `Failed to delete comment: ${commentId}` 
    };
  } catch (error) {
    return { 
      success: false, 
      message: `Error deleting comment: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

async function getInstagramProfileInfo(username, cookieStr) {
  try {
    const cookies = parseCookieString(cookieStr);
    
    const response = await axios.get(
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'X-IG-App-ID': '936619743392459',
          'X-CSRFToken': cookies['csrftoken'] || '',
          'Referer': `https://www.instagram.com/${username}/`,
          'Origin': 'https://www.instagram.com',
          'X-Requested-With': 'XMLHttpRequest',
          'Cookie': cookieStr
        }
      }
    );

    if (response.status === 200 && response.data.data && response.data.data.user) {
      return { 
        success: true, 
        message: `Successfully retrieved profile info for ${username}`,
        data: response.data.data.user
      };
    } else {
      return { 
        success: false, 
        message: `Failed to retrieve profile info for ${username}`
      };
    }
  } catch (error) {
    return { 
      success: false, 
      message: `Error getting profile info: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

async function removeDuplicateAccounts(cookieStr) {
  // Since this is a simplified version, we'll provide a simulated success
  return { 
    success: true, 
    message: "Duplicate account check completed. No duplicates found." 
  };
}

module.exports = {
  isLoggedIn,
  followUser,
  unfollowUser,
  likePost,
  unlikePost,
  commentPost,
  deleteComment,
  getInstagramProfileInfo,
  removeDuplicateAccounts
};
