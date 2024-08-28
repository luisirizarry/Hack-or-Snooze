"use strict";

const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

/******************************************************************************
 * Story: a single story in the system
 */

class Story {

  /** Make instance of Story from data object about story:
   *   - {title, author, url, username, storyId, createdAt}
   */

  constructor({ storyId, title, author, url, username, createdAt }) {
    this.storyId = storyId;
    this.title = title;
    this.author = author;
    this.url = url;
    this.username = username;
    this.createdAt = createdAt;
  }

  /** Parses hostname out of URL and returns it. */

  getHostName() {
    // Removes the http:// or https://
    const urlParts = this.url.split('//')[1];

    // Split by '/' to isolate the hostname
    const hostname = urlParts.split('/')[0];
  
    return hostname;
  }
}


/******************************************************************************
 * List of Story instances: used by UI to show story lists in DOM.
 */

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  /** Generate a new StoryList. It:
   *
   *  - calls the API
   *  - builds an array of Story instances
   *  - makes a single StoryList instance out of that
   *  - returns the StoryList instance.
   */

  static async getStories() {
    // Note presence of `static` keyword: this indicates that getStories is
    //  **not** an instance method. Rather, it is a method that is called on the
    //  class directly. Why doesn't it make sense for getStories to be an
    //  instance method?

    // query the /stories endpoint (no auth required)
    const response = await axios({
      url: `${BASE_URL}/stories`,
      method: "GET",
    });

    // turn plain old story objects from API into instances of Story class
    const stories = response.data.stories.map(story => new Story(story));

    // build an instance of our own class using the new array of stories
    return new StoryList(stories);
  }

  /** Adds story data to API, makes a Story instance, adds it to story list.
   * - user - the current instance of User who will post the story
   * - obj of {title, author, url}
   *
   * Returns the new Story instance
   */

  // Adds story from API and adds it to user's lists
  async addStory(user, newStory) {
    // Send a POST request
    const response = await axios({
      url: `${BASE_URL}/stories`,
      method: 'POST',
      data: { 
        token: user.loginToken, 
        story: { 
          title: newStory.title,
          author: newStory.author, 
          url: newStory.url
        }
      }
    });
  
    // Create a new Story from the data we got
    const addedStory = new Story(response.data.story);
    
    // Add the new story to the user's list of own stories
    user.ownStories.push(addedStory);
    
    // Return new story
    return addedStory;
  }
  
  // Delete story from API and remove it from user's lists
  async deleteStory(user, storyId) {
    // Send a DELETE request
    await axios({
      url: `${BASE_URL}/stories/${storyId}`,
      method: "DELETE",
      data: { token: user.loginToken } 
    });
  
    // Remove the story from the list of all stories
    this.removeStoryById(this.stories, storyId);
    this.removeStoryById(user.ownStories, storyId);
    this.removeStoryById(user.favorites, storyId);
  }
  
  removeStoryById(array, storyId) {
    // Find the index of the story with the ID we want
    const index = array.findIndex(story => story.storyId === storyId);
    
    // If the story is found, remove it 
    if (index !== -1) {
      array.splice(index, 1);
    }
  }
  
}


/******************************************************************************
 * User: a user in the system (only used to represent the current user)
 */

class User {
  /** Make user instance from obj of user data and a token:
   *   - {username, name, createdAt, favorites[], ownStories[]}
   *   - token
   */

  constructor({
                username,
                name,
                createdAt,
                favorites = [],
                ownStories = []
              },
              token) {
    this.username = username;
    this.name = name;
    this.createdAt = createdAt;

    // instantiate Story instances for the user's favorites and ownStories
    this.favorites = favorites.map(s => new Story(s));
    this.ownStories = ownStories.map(s => new Story(s));

    // store the login token on the user so it's easy to find for API calls.
    this.loginToken = token;
  }

  /** Register new user in API, make User instance & return it.
   *
   * - username: a new username
   * - password: a new password
   * - name: the user's full name
   */

  static async signup(username, password, name) {
    const response = await axios({
      url: `${BASE_URL}/signup`,
      method: "POST",
      data: { user: { username, password, name } },
    });

    let { user } = response.data

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      response.data.token
    );
  }

  /** Login in user with API, make User instance & return it.

   * - username: an existing user's username
   * - password: an existing user's password
   */

  static async login(username, password) {
    const response = await axios({
      url: `${BASE_URL}/login`,
      method: "POST",
      data: { user: { username, password } },
    });

    let { user } = response.data;

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      response.data.token
    );
  }

  /** When we already have credentials (token & username) for a user,
   *   we can log them in automatically. This function does that.
   */

  static async loginViaStoredCredentials(token, username) {
    try {
      const response = await axios({
        url: `${BASE_URL}/users/${username}`,
        method: "GET",
        params: { token },
      });

      let { user } = response.data;

      return new User(
        {
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          favorites: user.favorites,
          ownStories: user.stories
        },
        token
      );
    } catch (err) {
      console.error("loginViaStoredCredentials failed", err);
      return null;
    }
  }

  // Add or delete story from user's favorite list
  async addOrDeleteFavorite(story, addOrDelete) {
    // Determine method from parameter
    let method;
    if (addOrDelete === "add") {
      method = "POST"; // Use POST to add the story to favorites
    } else {
      method = "DELETE"; // Use DELETE to remove the story from favorites
    }
    
    // Send the request to add or remove the favorite
    await axios({
      url: `${BASE_URL}/users/${this.username}/favorites/${story.storyId}`, // URL for the favorite action
      method: method, // HTTP method (POST or DELETE)
      data: { token: this.loginToken } // Include the user's login token for authentication
    });
  }

  // Toggle the star for story
  async toggleFavorite(story, addOrDelete) {
    // Add or remove story from favorites list
    if (addOrDelete === "add") {
      // Add story to favorites
      this.favorites.push(story); 
    } else if (addOrDelete === "delete") {
      // Find story index
      const index = this.favorites.findIndex(s => s.storyId === story.storyId); 
      if (index !== -1) {
        // Remove story from favorites
        this.favorites.splice(index, 1); 
      }
    }

    // Tell API if user is adding or removing a favorite story
    await this.addOrDeleteFavorite(story, addOrDelete);
  }


}
