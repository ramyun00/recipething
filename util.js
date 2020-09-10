const omitTags = [
  'A',
  'FORM',
  'SCRIPT',
  'STYLE',
  'HEAD',
  'NAV',
  'FOOTER',
  'SELECT',
  'OPTION',
  'BUTTON'
];

// Makes ajax request to each bookmark, sets url as key in local storage,
// then sets the recipe's meta data as its value.
// bookmarkUrls is an array
function getBookmarks(bookmarkUrls) {
  console.log('in get bookmarks', bookmarkUrls);
  // Make an ajax request
  bookmarkUrls.forEach(function(bookmark) {
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'document';
    xhr.open("GET", bookmark.url, true);
    xhr.onreadystatechange = function() {
      if (xhr.status === 200 && xhr.readyState == 4) {
        chrome.storage.local.set({[bookmark.url]:
          {
            title: bookmark.title,
            data: parseResponse(xhr.response),
            tags: []
          }
        });
      }
    }
    xhr.send();
  });
}

function isBookmarkStoredAlready(url) {
  chrome.storage.local.get(null, function(result) {
    return !!Object.keys(result).find(key => key === url);
  });
}

// Nodes to exclude from text content parsing
function omitNode(nodeName) {
  return !omitTags.includes(nodeName);
}

// Takes in ajax response, returns array of strings from accepted nodes
function parseResponse(response) {
  var treeWalker = document.createTreeWalker(
    response,
    NodeFilter.SHOW_TEXT,
    { acceptNode: function(node) { if (omitNode(node.parentNode.nodeName)) { return NodeFilter.FILTER_ACCEPT; }}},
    false
  );
  
  var nodeList = [];
  var currentNode = treeWalker.currentNode;
  
  while(currentNode) {
    // Test if it's an empty string, newline character, or spaces.  If not, add to array of strings
    let nodeWholeText = currentNode.wholeText;
    if (nodeWholeText && !RegExp('^[\s\u000A\r\t\n \v\u2002\u2003\u2003\u202F\u2009\u00A0\,]*$').test(nodeWholeText) && !RegExp('^[\d\(\)\s]*$').test(nodeWholeText)) {
      nodeList.push(nodeWholeText);
    }
    currentNode = treeWalker.nextNode();
  }
  return nodeList;
}

export {
  getBookmarks,
  isBookmarkStoredAlready,
  parseResponse
};