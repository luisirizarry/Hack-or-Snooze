"use strict";

/******************************************************************************
 * Handling navbar clicks and updating navbar
 */

/** Show main list of all stories when click site name */

function navAllStories(evt) {
  console.debug("navAllStories", evt);
  hidePageComponents();
  putStoriesOnPage();
}

$body.on("click", "#nav-all", navAllStories);

/** Show login/signup on click on "login" */

function navLoginClick(evt) {
  console.debug("navLoginClick", evt);
  hidePageComponents();
  $loginForm.show();
  $signupForm.show();
}

$navLogin.on("click", navLoginClick);

/** When a user first logins in, update the navbar to reflect that. */

function updateNavOnLogin() {
  console.debug("updateNavOnLogin");
  $(".main-nav-links").show();
  $navLogin.hide();
  $navLogOut.show();
  $navUserProfile.text(`${currentUser.username}`).show();
}

function navSubmitClick(evt) {
  if(!currentUser) return;
  console.debug("navSubmitClick", evt);
  hidePageComponents();
  $submitStoryForm.show();
}

$navSubmit.on("click", navSubmitClick);

function favoriteClick(evt) {
  if(!currentUser) return;
  console.debug("favoriteClick", evt);
  hidePageComponents();
  putFavoriteStoriesOnPage();
}

$navFavorite.on("click", favoriteClick);

function myStoriesClick(evt) {
  if(!currentUser) return;
  console.debug("myStoriesClick", evt);
  hidePageComponents();
  putMyStoriesOnPage();
}

$navMyStories.on("click", myStoriesClick);


