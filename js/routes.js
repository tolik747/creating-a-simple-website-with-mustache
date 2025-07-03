/*
 * routes definition and handling for paramHashRouter
 */


import Mustache from "./mustache.js";
import processOpnFrmData from "./addOpinion.js";
import articleFormsHandler from "./articleFormsHandler.js";
//an array, defining the routes
//an array, defining the routes
export default[

    {
        //the part after '#' in the url (so-called fragment):
        hash:"welcome",
        ///id of the target html element:
        target:"router-view",
        //the function that returns content to be rendered to the target html element:
        getTemplate:(targetElm) =>
            document.getElementById(targetElm).innerHTML =
                document.getElementById("template-welcome").innerHTML
    },

    {
      hash:"articles",
      target:"router-view",
      getTemplate: fetchAndDisplayArticles
    },

    {
        hash:"opinions",
        target:"router-view",
        getTemplate: createHtml4opinions
    },
    {
        hash:"addOpinion",
        target:"router-view",
        getTemplate: (targetElm) =>{
            document.getElementById(targetElm).innerHTML = document.getElementById("template-addOpinion").innerHTML;
            document.getElementById("opnFrm").onsubmit=processOpnFrmData;
        }
    },
  {
    hash: "article",
    target: "router-view",
    getTemplate: (targetElm, artIdFromHash, offsetFromHash, totalCountFromHash) => {
      // Рендеринг статті
      fetchAndProcessArticle(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash, false);

      // Викликаємо функцію для завантаження коментарів після рендерингу статті
      afterArticleRender(() => {
        const offset = Number(offsetFromHash) || 0;
        loadComments(artIdFromHash, offset);
      });
    }
  },
    {
      hash:"artEdit",
      target:"router-view",
      getTemplate: editArticle
    },

    {
      hash: "addArticle",
      target: "router-view",
      getTemplate: insertArticle
    },
    {
      hash: "artDelete",
      target: "router-view",
      getTemplate: (targetElm, artIdFromHash) => {
        // Виклик функції для видалення статті
        deleteArticleConfirmation(artIdFromHash, urlBase);
      }
    }
];

//posilania
const urlBase = "https://wt.kpi.fei.tuke.sk/api";
const articlesPerPage = 20;

function createHtml4opinions(targetElm){
    const opinionsFromStorage=localStorage.myTreesComments;
    let opinions=[];

    if(opinionsFromStorage){
        opinions=JSON.parse(opinionsFromStorage);
        opinions.forEach(opinion => {
            opinion.created = (new Date(opinion.created)).toDateString();
            opinion.willReturn =
                opinion.willReturn?"I will return to this page.":"Sorry, one visit was enough.";
        });
    }

    document.getElementById(targetElm).innerHTML = Mustache.render(
        document.getElementById("template-opinions").innerHTML,
        opinions
    );
}


// let allArticles = [];
// async function fetchAndDisplayArticles(targetElm, currentPage = 1) {
//     const pageSize = 20;
//
//     if (allArticles.length === 0) {
//         const url = "https://jsonplaceholder.typicode.com/posts";
//
//         try {
//             const response = await fetch(url); // Очікуємо завершення запиту
//             const data = await response.json();
//             allArticles = data; // Зберігаємо всі статті
//             console.log("Fetched articles:", allArticles);
//         } catch (error) {
//             console.error("Error fetching articles:", error);
//             document.getElementById(targetElm).innerHTML = `
//                 <p>Failed to fetch articles. Please try again later.</p>
//             `;
//             return;
//         }
//     }
//
//     const totalPages = Math.ceil(allArticles.length / pageSize);
//     console.log("Total articles:", allArticles.length);
//     console.log("Total pages:", totalPages);
//
//     renderArticles(targetElm, currentPage, totalPages);
// }
//
// function renderArticles(targetElm, currentPage, totalPages) {
//     const startIndex = (currentPage - 1) * 20;
//     const endIndex = startIndex + 20;
//
//     const pageData = allArticles.slice(startIndex, endIndex);
//
//     const templateData = {
//         articles: pageData,
//         currPage: currentPage,
//         pageCount: totalPages,
//         hasPrev: currentPage > 1, // Якщо це не перша сторінка
//         hasNext: currentPage < totalPages, // Якщо це не остання сторінка
//         prevPage: currentPage - 1,
//         nextPage: currentPage + 1
//     };
//
//     console.log("Rendering page:", currentPage);
//     console.log("Has next page:", templateData.hasNext);
//
//     document.getElementById(targetElm).innerHTML = Mustache.render(
//         document.getElementById("template-articles").innerHTML,
//         templateData
//     );
// }
//https://wt.kpi.fei.tuke.sk/api/article?offset=0&max=200
///dla paginacii
function renderArticlesWithPagination(targetElm, responseJSON) {
  const offset = responseJSON.meta.offset || 0;
  const totalCount = responseJSON.meta.totalCount || 0;
  const currentPage = Math.floor(offset / articlesPerPage)+2;
  const totalPages = Math.ceil(totalCount / articlesPerPage);
  const hasPrev = offset > 0;
  const hasNext = offset + articlesPerPage < totalCount;
  const templateData = {
    articles: responseJSON.articles,
    hasPrev: hasPrev,
    hasNext: hasNext,
    prevPage: hasPrev ? currentPage - 2 : 0,
    nextPage: hasNext ? currentPage + 1 : totalPages - 1,
    currentPage: currentPage
  };

  document.getElementById(targetElm).innerHTML = Mustache.render(
    document.getElementById("template-articles").innerHTML,
    templateData
  );

  // Додаємо обробники подій для кнопок "Previous" і "Next"
  if (hasPrev) {
    document.querySelector(".prev").addEventListener("click", () => {
      const newOffset = Math.max(0, offset - articlesPerPage);
      const totalCountFromHash = responseJSON.meta.totalCount;
      fetchAndDisplayArticles(targetElm, newOffset, totalCountFromHash);
    });
  }

  if (hasNext) {
    document.querySelector(".next").addEventListener("click", () => {
      const newOffset = offset + articlesPerPage;
      const totalCountFromHash = responseJSON.meta.totalCount;
      fetchAndDisplayArticles(targetElm, newOffset, totalCountFromHash);

    });
  }
}

const customTag="mxgp";
//keyyyy
function fetchAndDisplayArticles(targetElm, offsetFromHash, totalCountFromHash) {
  const offset = Number(offsetFromHash) || 0;
  const totalCount = Number(totalCountFromHash) || 0;

  let urlQuery = `?tag=${customTag}&offset=${offset}&max=${articlesPerPage}`; // Додаємо параметр `tag`

  const url = `${urlBase}/article${urlQuery}`;

  function reqListener() {
    if (this.status == 200) {
      const responseJSON = JSON.parse(this.responseText);

      responseJSON.meta = {
        offset: offset,
        totalCount: totalCount || responseJSON.meta.totalCount,
      };

      // Додаємо посилання на детальний вигляд статті
      addArtDetailLink2ResponseJson(responseJSON);

      // Завантажуємо деталі кожної статті через AJAX
      const articlePromises = responseJSON.articles.map(article => {
        return fetchArticleContent(article.id)
          .then(detail => ({
            ...article,
            articleContent: detail.content || "No content available", // Додаємо повний контент
            shortContent: detail.content
              ? detail.content.substring(0, 200) + "..." // Скорочений контент
              : "No content available.",
          }))
          .catch(error => {
            console.error(error);
            return {
              ...article,
              articleContent: "Error loading content",
              shortContent: "Error loading content",
            };
          });
      });

      // Коли всі статті завантажені
      Promise.all(articlePromises).then(articlesWithContent => {
        responseJSON.articles = articlesWithContent;

        // Рендеримо статті з пагінацією
        renderArticlesWithPagination(targetElm, responseJSON);
      });
    } else {
      const errMsgObj = { errMessage: this.responseText };
      document.getElementById(targetElm).innerHTML = Mustache.render(
        document.getElementById("template-articles-error").innerHTML,
        errMsgObj
      );
    }
  }

  console.log(url);
  var ajax = new XMLHttpRequest();
  ajax.addEventListener("load", reqListener);
  ajax.open("GET", url, true);
  ajax.send();
}



///uloha 6
function addArtDetailLink2ResponseJson(responseJSON){
  responseJSON.articles = responseJSON.articles.map(
    article =>(
      {
        ...article,
        detailLink:`#article/${article.id}/${responseJSON.meta.offset||0}/${responseJSON.meta.totalCount||0}`
      }
    )
  );
}
function fetchAndDisplayArticleDetail(targetElm,artIdFromHash,offsetFromHash,totalCountFromHash) {
  fetchAndProcessArticle(...arguments,false);
}

/**
 * Gets an article record from a server and processes it to html according to
 * the value of the forEdit parameter. Assumes existence of the urlBase global variable
 * with the base of the server url (e.g. "https://wt.kpi.fei.tuke.sk/api"),
 * availability of the Mustache.render() function and Mustache templates
 * with id="template-article" (if forEdit=false) and id="template-article-form" (if forEdit=true).
 * @param targetElm - id of the element to which the acquired article record
 *                    will be rendered using the corresponding template
 * @param artIdFromHash - id of the article to be acquired
 * @param offsetFromHash - current offset of the article list display to which the user should return
 * @param totalCountFromHash - total number of articles on the server
 * @param forEdit - if false, the function renders the article to HTML using
 *                            the template-article for display.
 *                  If true, it renders using template-article-form for editing.
 */

function fetchAndProcessArticle(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash, forEdit) {
  const url = `${urlBase}/article/${artIdFromHash}`;

  function reqListener() {
    console.log(this.responseText);

    if (this.status == 200) {
      const responseJSON = JSON.parse(this.responseText);

      if (forEdit) {
        responseJSON.formTitle = "Article Edit";
        responseJSON.submitBtTitle = "Save article";
        responseJSON.backLink = `#article/${artIdFromHash}/${offsetFromHash}/${totalCountFromHash}`;

        document.getElementById(targetElm).innerHTML =
          Mustache.render(
            document.getElementById("template-article-form").innerHTML,
            responseJSON
          );

        if (!window.artFrmHandler) {
          window.artFrmHandler = new articleFormsHandler("https://wt.kpi.fei.tuke.sk/api");
        }

        window.artFrmHandler.assignFormAndArticle(
          "articleForm",
          "hiddenElm",
          artIdFromHash,
          offsetFromHash,
          totalCountFromHash
        );
      } else {
        responseJSON.backLink = `#articles/${offsetFromHash}/${totalCountFromHash}`;
        responseJSON.editLink = `#artEdit/${responseJSON.id}/${offsetFromHash}/${totalCountFromHash}`;
        responseJSON.deleteLink = `#artDelete/${responseJSON.id}/${offsetFromHash}/${totalCountFromHash}`;

        // Рендеримо статтю
        document.getElementById(targetElm).innerHTML =
          Mustache.render(
            document.getElementById("template-article").innerHTML,
            responseJSON
          );

        // Завантаження коментарів
        loadComments(artIdFromHash);

        // Налаштування форми для додавання коментарів
        setupCommentForm(artIdFromHash);
      }
    } else {
      const errMsgObj = { errMessage: this.responseText };
      document.getElementById(targetElm).innerHTML =
        Mustache.render(
          document.getElementById("template-articles-error").innerHTML,
          errMsgObj
        );
    }
  }

  console.log(url);
  var ajax = new XMLHttpRequest();
  ajax.addEventListener("load", reqListener);
  ajax.open("GET", url, true);
  ajax.send();
}


function editArticle(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash) {
  fetchAndProcessArticle(...arguments,true);
}


///dodavania statej
function insertArticle(targetElm) {
  document.getElementById(targetElm).innerHTML =
    Mustache.render(
      document.getElementById("template-article-form").innerHTML,
      {
        formTitle: "New Article",
        submitBtTitle: "Add Article",
        backLink: `#articles`,
        tags:"mxgp",
      }
    );

  if (!window.artFrmHandler) {
    window.artFrmHandler = new articleFormsHandler(urlBase);
  }
  window.artFrmHandler.assignFormAndArticle("articleForm", "hiddenElm", -1);
}

function deleteArticle(articleId) {
  // Confirm the delete action
  if (confirm('Are you sure you want to delete this article?')) {
    // Assuming we have an API or data array to interact with
    fetch(`/api/articles/${articleId}`, {
      method: 'DELETE',
    })
      .then(response => {
        if (response.ok) {
          alert('Article deleted successfully!');
          // Optionally, remove the article from the UI
          const articleElement = document.getElementById(`article-${articleId}`);
          if (articleElement) {
            articleElement.remove();
          }
        } else {
          alert('Failed to delete the article. Please try again.');
        }
      })
      .catch(error => {
        console.error('Error deleting article:', error);
        alert('An error occurred while deleting the article.');
      });
  }
}

//  Add event listeners to delete buttons
window.addEventListener('DOMContentLoaded', () => {
  const deleteButtons = document.querySelectorAll('.delete-article-button');
  deleteButtons.forEach(button => {
    button.addEventListener('click', (event) => {
      const articleId = event.target.dataset.articleId;
      deleteArticle(articleId);
    });
  });
});


function deleteArticleConfirmation(artIdFromHash, urlBase) {
  if (!artIdFromHash || !urlBase) {
    alert("Invalid article ID or server URL.");
    return;
  }

  if (confirm("Are you sure you want to delete this article?")) {
    const url = `${urlBase}/article/${artIdFromHash}`;
    fetch(url, { method: "DELETE" })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to delete article. Status: ${response.status}`);
        }
        alert("Article deleted successfully!");
        location.hash = "#articles"; // Redirect to articles list
      })
      .catch((error) => {
        console.error("Error deleting article:", error);
        alert("Error: " + error.message);
      });
  } else {
    location.hash = `#article/${artIdFromHash}`; // Redirect to the specific article
  }
}

//для роботи без фенч
function fetchArticleContent(articleId) {
  return new Promise((resolve, reject) => {
    const url = `${urlBase}/article/${articleId}`;
    const xhr = new XMLHttpRequest();

    xhr.open("GET", url, true);

    xhr.onload = function () {
      if (xhr.status === 200) {
        const detail = JSON.parse(xhr.responseText);
        resolve(detail);
      } else {
        reject(`Error fetching article ${articleId}: ${xhr.status}`);
      }
    };

    xhr.onerror = function () {
      reject(`Network error while fetching article ${articleId}`);
    };

    xhr.send();
  });
}





///coment


function loadComments(articleId, offset = 0, max = 10) {
  const commentsList = document.getElementById("comments-list");

  if (!commentsList) {
    console.error("Comments list not found in DOM");
    return;
  }

  const url = `${urlBase}/article/${articleId}/comment?max=${max}&offset=${offset}`;

  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to load comments: ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      console.log("Comments data:", data);

      const comments = data.comments;

      if (!Array.isArray(comments) || comments.length === 0) {
        commentsList.innerHTML = "<p>No comments available for this article.</p>";
        renderCommentPagination(articleId, offset, data.meta.totalCount, max); // Показуємо пагінацію навіть якщо немає коментарів
        return;
      }

      // Очищуємо список перед вставкою нових коментарів
      commentsList.innerHTML = "";
      comments.forEach(comment => {
        const commentElement = document.createElement("div");
        commentElement.innerHTML = `<strong><p class="customforcom">Author:</strong> ${comment.author}</p><strong><p class="customforcom">Comment:</strong> ${comment.text}</p><br>`;
        commentsList.appendChild(commentElement);
      });

      // Оновлюємо пагінацію
      renderCommentPagination(articleId, offset, data.meta.totalCount, max);
    })
    .catch(error => console.error("Error loading comments:", error));
}

function renderCommentPagination(articleId, offset, totalCount, max) {
  const paginationElement = document.getElementById("pagination-controls");

  if (!paginationElement) {
    console.error("Pagination element not found in DOM");
    return;
  }

  // Очищуємо попередні кнопки пагінації
  paginationElement.innerHTML = "";

  const hasPrev = offset > 0;
  const hasNext = offset + max < totalCount;

  if (hasPrev) {
    const prevButton = document.createElement("button");
    prevButton.textContent = "Previous";
    prevButton.className = "pagination-button";
    prevButton.addEventListener("click", () => {
      const newOffset = Math.max(0, offset - max);
      loadComments(articleId, newOffset, max);
    });
    paginationElement.appendChild(prevButton);
  }

  if (hasNext) {
    const nextButton = document.createElement("button");
    nextButton.textContent = "Next";
    nextButton.className = "pagination-button";
    nextButton.addEventListener("click", () => {
      const newOffset = offset + max;
      loadComments(articleId, newOffset, max);
    });
    paginationElement.appendChild(nextButton);
  }
}


function afterArticleRender(callback) {
  const observer = new MutationObserver((mutations, observerInstance) => {
    const commentsSection = document.getElementById("comments-list");
    if (commentsSection) {
      observerInstance.disconnect(); // Зупиняємо спостереження
      callback(); // Викликаємо передану функцію
    }
  });

  // Спостерігаємо за змінами у DOM
  observer.observe(document.body, { childList: true, subtree: true });
}

function setupCommentForm(articleId) {
  const commentForm = document.getElementById("comment-form");
  const commentAuthor = document.getElementById("comment-author");
  const commentText = document.getElementById("comment-text");
  const addCommentButton = document.getElementById("add-comment-button");
  const cancelCommentButton = document.getElementById("cancel-comment-button");

  // Перевірка наявності всіх елементів
  if (!commentForm || !commentAuthor || !commentText || !addCommentButton || !cancelCommentButton) {
    console.error("Comment form elements not found in DOM");
    return;
  }

  // Показуємо форму при натисканні "Add Comment"
  addCommentButton.addEventListener("click", () => {
    addCommentButton.style.display = "none"; // Ховаємо кнопку "Add Comment"
    commentForm.style.display = "block"; // Показуємо форму
  });

  // Ховаємо форму при натисканні "Cancel"
  cancelCommentButton.addEventListener("click", () => {
    commentForm.reset(); // Скидаємо поля форми
    commentForm.style.display = "none"; // Ховаємо форму
    addCommentButton.style.display = "block"; // Показуємо кнопку "Add Comment"
  });

  // Обробка відправки форми
  commentForm.addEventListener("submit", event => {
    event.preventDefault();

    const author = commentAuthor.value.trim();
    const text = commentText.value.trim();

    if (author && text) {
      fetch(`${urlBase}/article/${articleId}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ author, text })
      })
        .then(response => {
          if (response.ok) {
            // Оновлюємо список коментарів
            loadComments(articleId);
            // Скидаємо поля форми
            commentAuthor.value = "";
            commentText.value = "";
            // Ховаємо форму та повертаємо кнопку "Add Comment"
            commentForm.style.display = "none";
            addCommentButton.style.display = "block";
          } else {
            console.error("Error adding comment:", response.statusText);
          }
        })
        .catch(error => console.error("Error adding comment:", error));
    } else {
      alert("Please fill in both fields before submitting!");
    }
  });
}


///sing form



export let userFullName = null;

function initializeGoogleSignIn() {
  google.accounts.id.initialize({
    client_id: "154374438506-f7esa4lmvhps68u09km7181d6qjc4u3s.apps.googleusercontent.com",
    callback: handleCredentialResponse,
  });
  google.accounts.id.renderButton(
    document.getElementById("google-signin-container"),
    { theme: "outline", size: "large" }
  );
  google.accounts.id.prompt(); // Показуємо кнопку входу
}

function handleCredentialResponse(response) {
  const decodedResponse = parseJwt(response.credential);
  console.log("Google User Info:", decodedResponse);
  if (decodedResponse.name) {
    userFullName = decodedResponse.name;
    document.getElementById("user-name").textContent = `Welcome, ${userFullName}`;
    document.getElementById("sign-out-btn").style.display = "inline-block";
    document.getElementById("google-signin-container").style.display = "none";
  } else {
    console.error("Name not found in Google response.");
  }
}

document.getElementById("sign-out-btn").addEventListener("click", () => {
  google.accounts.id.disableAutoSelect();
  userFullName = null;
  document.getElementById("user-name").textContent = "";
  document.getElementById("sign-out-btn").style.display = "none";
  document.getElementById("google-signin-container").style.display = "block";
  console.log("User signed out.");
});

function parseJwt(token) {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
  return JSON.parse(jsonPayload);
}

// Викликаємо ініціалізацію
document.addEventListener("DOMContentLoaded", initializeGoogleSignIn);
function autoFillAuthorField(formId) {
  const authorField = document.querySelector(`#${formId} [name='author']`);
  if (authorField) {
    if (userFullName) {
      authorField.value = userFullName;
      console.log(`Author field filled for ${formId}`);
    } else {
      console.warn("User name not available for auto-fill.");
    }
  } else {
    console.error(`Author field not found for form: ${formId}`);
  }
}

// Спостереження за DOM для нових форм
const observer = new MutationObserver(() => {
  const forms = ["articleForm", "opnFrm", "comment-form"];
  forms.forEach(formId => {
    const form = document.getElementById(formId);
    if (form) {
      autoFillAuthorField(formId);
    }
  });
});
observer.observe(document.body, { childList: true, subtree: true });

