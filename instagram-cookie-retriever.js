/**
 * Instagram Cookie Retriever
 * A JavaScript implementation to retrieve Instagram authentication cookies.
 * 
 * Direct conversion from the Python script to JavaScript for Node.js
 */

const axios = require('axios');

/**
 * Get Instagram cookies using email and password
 * @param {string} email - Instagram email/username
 * @param {string} password - Instagram password
 * @returns {Promise<object>} - Object containing cookies and success status
 */
async function getInstagramCookies(email, password) {
  try {
    const session = axios.create();
    session.defaults.withCredentials = true;
    
    console.log("\x1b[32m[INFO]\x1b[0m Retrieving CSRF token and logging in...");
    
    // Initial request to get CSRF token
    const resp = await session.get('https://www.instagram.com/accounts/login/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
    
    // Get cookies from the response
    let cookies = {};
    if (resp.headers['set-cookie']) {
      resp.headers['set-cookie'].forEach(cookie => {
        const parts = cookie.split(';')[0].split('=');
        if (parts.length === 2) {
          cookies[parts[0]] = parts[1];
        }
      });
    }
    
    const csrftoken = cookies.csrftoken;
    if (!csrftoken) {
      console.log("\x1b[31m[ERROR]\x1b[0m Failed to retrieve CSRF token.");
      return { success: false, message: 'Failed to retrieve CSRF token' };
    }
    
    // Prepare login payload
    const timestamp = Math.floor(Date.now() / 1000);
    const payload = new URLSearchParams({
      username: email,
      enc_password: `#PWD_INSTAGRAM_BROWSER:0:${timestamp}:${password}`,
      queryParams: '{}',
      optIntoOneTap: 'false'
    });
    
    // Login request
    const loginResponse = await session.post('https://www.instagram.com/accounts/login/ajax/', payload, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': 'https://www.instagram.com/accounts/login/',
        'Origin': 'https://www.instagram.com',
        'X-CSRFToken': csrftoken,
        'Cookie': Object.entries(cookies).map(([k,v]) => `${k}=${v}`).join('; ')
      }
    });
    
    const loginData = loginResponse.data;
    
    if (loginResponse.status !== 200 || !loginData.authenticated) {
      console.log(`\x1b[31m[ERROR]\x1b[0m Login failed: ${loginData.message || 'Authentication failed'}`);
      return { 
        success: false, 
        message: loginData.message || 'Authentication failed. Please check your credentials.'
      };
    }
    
    // Update cookies from login response
    if (loginResponse.headers['set-cookie']) {
      loginResponse.headers['set-cookie'].forEach(cookie => {
        const parts = cookie.split(';')[0].split('=');
        if (parts.length === 2) {
          cookies[parts[0]] = parts[1];
        }
      });
    }
    
    // Generate essential cookie string (direct equivalent to the Python version)
    const essentialCookies = {
      csrftoken: cookies.csrftoken || '',
      sessionid: cookies.sessionid || '',
      ds_user_id: cookies.ds_user_id || '',
      mid: cookies.mid || '',
      ig_did: cookies.ig_did || '',
      ig_nrcb: cookies.ig_nrcb || '',
      rur: cookies.rur || ''
    };
    
    const essentialCookieString = Object.entries(essentialCookies)
      .filter(([_, value]) => value)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
    
    console.log("\x1b[32m[SUCCESS]\x1b[0m Successfully retrieved Instagram cookies!");
    
    return {
      success: true,
      cookies: essentialCookies,
      cookieString: essentialCookieString
    };
  } catch (error) {
    console.error("\x1b[31m[ERROR]\x1b[0m Error retrieving Instagram cookies:", error.message);
    return { 
      success: false, 
      message: error.message || 'Unknown error occurred'
    };
  }
}

/**
 * Parse cookie string into object
 * @param {string} cookieStr - Cookie string to parse
 * @returns {object} - Object with cookie key-value pairs
 */
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

/**
 * Command-line interface for Instagram cookie retriever
 */
async function main() {
  // Clear console
  console.clear();
  
  // Display colorful banner
  console.log("\x1b[35m");
  console.log(" ___ _   _ ____ _____  _    ____ ____      _    __  __ ");
  console.log("|_ _| \\ | / ___|_   _|/ \\  / ___|  _ \\    / \\  |  \\/  |");
  console.log(" | ||  \\| \\___ \\ | | / _ \\| |  _| |_) |  / _ \\ | |\\/| |");
  console.log(" | || |\\  |___) || |/ ___ \\ |_| |  _ <  / ___ \\| |  | |");
  console.log("|___|_| \\_|____/ |_/_/   \\_\\____|_| \\_\\/_/   \\_\\_|  |_|");
  console.log("\x1b[36m Cookie Retriever \x1b[0m");
  console.log();
  
  // Get credentials from command line arguments or prompt
  const args = process.argv.slice(2);
  const email = args[0] || await promptInput("Enter Instagram Email: ");
  const password = args[1] || await promptInput("Enter Instagram Password: ");
  
  console.log();
  
  // Retrieve cookies
  const result = await getInstagramCookies(email, password);
  
  if (!result.success) {
    console.log(`\x1b[31m[FAIL]\x1b[0m ${result.message}`);
    process.exit(1);
  }
  
  // Display results
  console.log("\x1b[36m┌─────────────────────────────────────────────┐\x1b[0m");
  console.log("\x1b[36m│\x1b[33m               RESULTS                    \x1b[36m│\x1b[0m");
  console.log("\x1b[36m├─────────────────────────────────────────────┤\x1b[0m");
  
  // Print individual cookies
  Object.entries(result.cookies).forEach(([key, value]) => {
    if (value) {
      console.log(`\x1b[36m│\x1b[0m ${key}: ${value.length > 30 ? value.substring(0, 27) + '...' : value.padEnd(30)}\x1b[36m │\x1b[0m`);
    }
  });
  
  console.log("\x1b[36m│\x1b[0m                                         \x1b[36m │\x1b[0m");
  console.log("\x1b[36m│\x1b[0m Cookie String:                          \x1b[36m │\x1b[0m");
  console.log(`\x1b[36m│\x1b[0m ${result.cookieString.substring(0, 40)}... \x1b[36m│\x1b[0m`);
  console.log("\x1b[36m└─────────────────────────────────────────────┘\x1b[0m");
  
  // Ask to save cookie to file
  const save = await promptInput("\n\x1b[36mSave cookie string to file? (y/N):\x1b[0m ");
  
  if (save.toLowerCase() === 'y') {
    const fs = require('fs');
    const filePath = await promptInput("\x1b[33mEnter file path to save:\x1b[0m ");
    
    try {
      fs.writeFileSync(filePath, result.cookieString);
      console.log(`\x1b[32m[SUCCESS]\x1b[0m Cookies saved to ${filePath}`);
    } catch (error) {
      console.log(`\x1b[31m[ERROR]\x1b[0m Failed to save file: ${error.message}`);
    }
  }
}

/**
 * Helper function to prompt for input in CLI
 * @param {string} question - Question to display
 * @returns {Promise<string>} - User input
 */
function promptInput(question) {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

// Export functions for module usage
module.exports = {
  getInstagramCookies,
  parseCookieString
};

// Run main function if script is executed directly
if (require.main === module) {
  main().catch(console.error);
}
