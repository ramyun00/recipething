const searchForm = document.getElementById('rtSearchForm');
const searchButton = document.getElementById('rtSearchButton');
const input = document.getElementById('rtInput');
const searchResult = document.getElementById('searchResult');

function updateTagList(tagArray, element, url) {
  // Make HTMLCollection an array
  let divs = [...element.getElementsByTagName('div')];

  // Delete old tags
  for (let i = 0; i < divs.length; i++) {
    element.removeChild(divs[i]);
  }
  // Push current tags into fragment
  const fragment = document.createDocumentFragment();
  tagArray.forEach(function(thisTag) {
    const tag = document.createElement('div');
    tag.className = 'rt__tag';

    const tagText = document.createElement('span');
    tagText.className = 'rt__tag-text';
    tagText.textContent = thisTag;

    const tagDelete = document.createElement('button');
    tagDelete.className = 'rt__tag-delete-button';
    tagDelete.textContent = 'x';
    tagDelete.addEventListener('click', function() {
      chrome.storage.local.get(url, function(data) {
        const updatedData = { ...data[url] };
        const index = updatedData.tags.indexOf(thisTag);
        updatedData.tags.splice(index, 1);
        chrome.storage.local.set({[url]: updatedData}, updateTagList(updatedData.tags, element, url));
      });
    });

    tag.appendChild(tagText);
    tag.appendChild(tagDelete);
    fragment.appendChild(tag);
  });

  // Add tags before add button
  const addButton = element.querySelector('.rt__tag-add');
  element.insertBefore(fragment, addButton);
}

function searchRecipes(e) {
  e.preventDefault();
  searchResult.innerHTML = ``;
  let matchingSites = [];
  const regexInputValue = new RegExp(input.value);
  if (input.value) {
    chrome.storage.local.get(null, function(result) {
      for (const prop in result) {
        // Loop through data first
        for (let i = 0; i < result[prop].data.length; i++) {
          // If search term matches a string in data and site isn't already in match list
          if (regexInputValue.test(result[prop].data[i]) && !matchingSites.find(obj => obj.url === prop)) {
            const thisGuy = {
              url: prop,
              title: result[prop].title,
              tags: result[prop].tags
            };
            matchingSites.push(thisGuy);
          }
        }
        // Loop through tags
        for (let i = 0; i < result[prop].tags.length; i++) {
          if (regexInputValue.test(result[prop].tags[i]) && !matchingSites.find(obj => obj.url === prop)) {
            const thisOtherGuy = {
              url: prop,
              title: result[prop].title,
              tags: result[prop].tags
            };
            matchingSites.unshift(thisOtherGuy);
          }
        }
      }
      if (matchingSites.length > 0) {
        matchingSites.forEach(function(site) {
          const documentFragment = document.createDocumentFragment();
          const wrapperDiv = document.createElement('div');
          wrapperDiv.className = 'rt__result';

          const link = document.createElement('a');
          link.href = site.url;
          link.className = 'rt__result-link';
          link.textContent = site.title;

          const description = document.createElement('p');
          description.className = 'rt__result-description';
          description.textContent = 'Teenage Mutant Ninja Turtles';

          const tags = document.createElement('div');
          tags.className = 'rt__tag-wrapper';
          const addButton = document.createElement('button');
          addButton.className = 'rt__tag rt__tag-add';
          addButton.type = 'button';
          addButton.textContent = '+';
          addButton.addEventListener('click', function() {
            const newTagInput = document.createElement('input');
            newTagInput.className = 'rt__new-tag-input';
            newTagInput.type = 'text';
            newTagInput.maxLength = '200';
            addButton.before(newTagInput);
            newTagInput.focus();

            function makeNewTag() {
              if (newTagInput.value !== '') {
                chrome.storage.local.get(site.url, function(data) {
                  let updatedData = { ...data[site.url] };
                  updatedData.tags.push(newTagInput.value);
                  chrome.storage.local.set({[site.url]: updatedData}, function() {
                    updateTagList(updatedData.tags, tags, site.url)
                  });
                });
              }
              newTagInput.remove();
            };

            function makeNewTagOnKeydown(e) {
              if (e.keyCode === 13) {
                makeNewTag();
              }
              return false;
            }
            newTagInput.addEventListener('focusout', makeNewTag);
            newTagInput.addEventListener('keydown', makeNewTagOnKeydown);
          });

          updateTagList(site.tags, tags, site.url);
          tags.appendChild(addButton);
          wrapperDiv.appendChild(link);
          wrapperDiv.appendChild(description);
          wrapperDiv.appendChild(tags);
          documentFragment.appendChild(wrapperDiv);
          searchResult.appendChild(documentFragment);
        });
      } else {
        const noResults = document.createElement('div');
        noResults.class = 'rt__no-results';
        noResults.textContent = 'No Recipes Found';
        searchResult.appendChild(noResults);
      }

      const links = document.getElementsByTagName('a');
      for (let i = 0; i < links.length; i++) {
        (function() {
            const ln = links[i];
            const location = ln.href;
            ln.onclick = function () {
                chrome.tabs.update({active: true, url: location});
            };
        })();
      }
    });
  }
};

searchForm.addEventListener('submit', searchRecipes);