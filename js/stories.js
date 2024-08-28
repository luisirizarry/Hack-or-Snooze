"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
  // If there is no current user, dont add any favorites
  if (currentUser) {
    updateFavoritesOnPage();
  }
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

// Borrowed the implementation for the delete button from solution
function generateStoryMarkup(story, showDeleteBtn = false) {
  // Determine if the story is a favorite, and if a user exists
  const isFavorite = currentUser ? currentUser.favorites.some(favStory => favStory.storyId === story.storyId) : false;
  
  const hostName = story.getHostName();
  return $(`
      <li id="${story.storyId}">
        <div>
          <span class="star ${isFavorite ? 'active' : ''}"></span>
          <a href="${story.url}" target="a_blank" class="story-link">
            ${story.title}
          </a>
          <small class="story-hostname">(${hostName})</small>
          <small class="story-author">by ${story.author}</small>
          <small class="story-user">posted by ${story.username}</small>
          ${showDeleteBtn ? `<button class="delete-btn">Delete</button>` : ''}
        </div>
      </li>
    `);
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();

  if(currentUser){
    updateFavoritesOnPage();  
  }
}

async function addNewStory(evt){
  console.debug("addNewStory");
  evt.preventDefault();

  // Grab the info from the form
  const author = $("#submit-story-author").val();
  const title = $("#submit-story-title").val();
  const url = $("#submit-story-url").val();

  // Add the information from the user, and get the story from method
  const story = await storyList.addStory(currentUser, { author, title, url });

  // Create the story and place it at the top
  const $story = generateStoryMarkup(story);
  $allStoriesList.prepend($story);

  // CLear the inputs
  $submitStoryForm[0].reset();
}

$submitStoryForm.on("submit", addNewStory);

async function changeFavorite(evt) {
  console.debug("changeFavorite");

  // Get the clicked star element
  const $star = $(evt.target);
  
  // Find the story ID from the closest <li> element
  const storyId = $star.closest("li").attr("id");
  
  let story;
  // Find the story in story list with the same ID
  for (let s of storyList.stories) {
    if (s.storyId === storyId) {
      story = s;
      break;
    }
  }

  // Check if the star is currently active
  const isFavorite = $star.hasClass("active");

  // Toggle the star for story
  if (isFavorite) {
    // If its favorited, remove from favorites
    await currentUser.toggleFavorite(story, "delete");
    $star.removeClass("active"); 
  } else {
    // If its not favorited, add to favorites
    await currentUser.toggleFavorite(story, "add");
    $star.addClass("active"); 
  }
}

$storiesLists.on("click", ".star", changeFavorite);

function putFavoriteStoriesOnPage() {
  // If there is no current user, exit the function
  if (!currentUser) return;
  
  console.debug("putFavoriteStoriesOnPage");

  // Empty favorites list
  $favoriteStories.empty();

  // Loop through all of the user's favorite stories
  for (let story of currentUser.favorites) {
    // Create HTML for each story
    const $story = generateStoryMarkup(story);
    // Append story
    $favoriteStories.append($story);
  }

  // Show the favorites list
  $favoriteStories.show();
}

function updateFavoritesOnPage() {
  console.debug("updateFavoritesOnPage");

  // Loop through all storys in the list
  $allStoriesList.find(".star").each(function () {
    const $star = $(this);
    // Get the ID of the story
    const storyId = $star.closest("li").attr("id");
    // Get the list of favorite story IDs from user
    const favoriteStoryIds = currentUser.favorites.map(story => story.storyId);
    // Check if the current story ID is in the list of favorite story IDs
    const isFavorite = favoriteStoryIds.includes(storyId);

    // Add or remove star if isFavorite exists, or its -1
    if (isFavorite) {
      $star.addClass("active");
    } else {
      $star.removeClass("active");
    }
  });
}

function putMyStoriesOnPage() {
  // If there is no current user, exit the function
  if (!currentUser) return;

  console.debug("putMyStoriesOnPage");

  // Empty stories lst
  $myStories.empty(); 

  // Loop through all of the user's own stories
  for (let story of currentUser.ownStories) {
    // Since its going to be in the my stories tab, the delete button neeeds to be added
    const $story = generateStoryMarkup(story, true);
    // Append story
    $myStories.append($story); 
  }

  // Show list of stories
  $myStories.show(); 
}

async function deleteStory(evt) {
  // If there is no current user, exit the function
  if (!currentUser) return;

  console.debug("deleteStory", evt);

  // Get button that was clicked
  const $button = $(evt.target);
  // Find ID of the story to delete
  const storyId = $button.closest("li").attr("id"); 

  // Remove story from the user's story list
  await storyList.deleteStory(currentUser, storyId);

  // Remove story from dom
  $button.closest("li").remove();
}

$storiesLists.on("click", ".delete-btn", deleteStory);
