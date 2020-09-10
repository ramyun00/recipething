import { getBookmarks, isBookmarkStoredAlready } from './util.js';

chrome.runtime.onInstalled.addListener(function() {
  // Get user's email
  chrome.identity.getProfileUserInfo('ANY', function(stuff) {
    console.log('what is this stuff', stuff);
  });

  chrome.storage.local.clear();
  // Check if RecipeThing folder exists.  If it doesn't exist, create it
  chrome.bookmarks.getTree(function(tree) {
    let folderExists = tree[0].children[0].children.find(bookmark => bookmark.title === 'RecipeThing');
    if (!folderExists) {
      chrome.bookmarks.create(
        {
          'parentId': '1',
          'title': 'RecipeThing'
        });
    } else {
      // If RecipeThing folder exists already, get all of the bookmark urls and process them
      let folderIndex = -1;
      let bookmarkUrls = [];
      chrome.bookmarks.getTree(async function(tree) {
        // Hopefully find the RecipeThing folder, map existing bookmark urls into an array
        folderIndex = tree[0].children[0].children.findIndex(function(bookmark) { return bookmark.title === 'RecipeThing'});
        bookmarkUrls = await tree[0].children[0].children[folderIndex].children.map(function(bookmark) {
          return { url: bookmark.url, title: bookmark.title };
        });
        getBookmarks(bookmarkUrls);
      });
    }
  });
});

// Crawl a page when bookmark is added
chrome.bookmarks.onCreated.addListener(function(bookmark) {
  let recipeThingFolderId = '';
  let recipeThingFolderObject;
  console.log('bookmark added');
  // Get RecipeThing folder ID
  chrome.bookmarks.getTree(function(tree) {
    recipeThingFolderObject = tree[0].children[0].children.find(bookmark => bookmark.title === 'RecipeThing');
    if (recipeThingFolderObject && !recipeThingFolderObject.url) {
      recipeThingFolderId = recipeThingFolderObject.id;
    }
  });

  // Check that the bookmark was added to the RecipeThing folder and not another folder, then process it
  chrome.bookmarks.get(bookmark, function(addedBookmark) {
    if (addedBookmark[0].parentId === recipeThingFolderId && !isBookmarkStoredAlready(addedBookmark[0].url)) {
      console.log('getting new bookmark');
      getBookmarks([{url: addedBookmark[0].url, title: addedBookmark[0].title}]);
    }
  });
});

// Remove bookmark's local data when it's deleted from RecipeThing folder
chrome.bookmarks.onRemoved.addListener(function(id, removeInfo) {
  console.log('removed id', id, 'info', removeInfo);
  chrome.storage.local.remove(removeInfo.node.url);
  chrome.storage.local.get(null, function(result) {
    console.log('result', result);
  })
});