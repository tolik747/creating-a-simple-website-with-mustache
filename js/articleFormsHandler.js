/*
 * Created by Stefan Korecko, 2021
 * Functions to handle forms for article editing and inserting
 */

export default class articleFormsHandler {
  /**
   * @param articlesServerUrl - basic part of the server url, without the service specification, i.e. https://wt.kpi.fei.tuke.sk/api
   */
  constructor(articlesServerUrl) {
    this.serverUrl = articlesServerUrl;
  }

  /**
   * Assigns a matching form and article parameters to the handler
   * @param formElementId - id of the html element with the form, i.e. "articleForm".
   * @param cssClass2hideElement - name of the css class setting display to none, i.e. "hiddenElm".
   * @param articleId - id of the article to be updated. Value <0 means that the form is for adding a new article.
   * @param offset - current offset of the article list display to which the user should return.
   * @param totalCount - total number of the articles on the server.
   */
  assignFormAndArticle(formElementId, cssClass2hideElement, articleId, offset, totalCount) {
    this.cssCl2hideElm = cssClass2hideElement;
    const artForm = document.getElementById(formElementId);
    this.formElements = artForm.elements;

    this.formElements.namedItem('btShowFileUpload').onclick = () => this.showFileUpload();
    this.formElements.namedItem('btFileUpload').onclick = () => this.uploadImg();
    this.formElements.namedItem('btCancelFileUpload').onclick = () => this.cancelFileUpload();

    if (articleId >= 0) {
      // Редагування існуючої статті
      artForm.onsubmit = (event) => this.processArtEditFrmData(event);
      this.articleId = articleId;
      this.offset = offset;
      this.totalCount = totalCount;
    } else {
      // Додавання нової статті
      artForm.onsubmit = (event) => this.processArtInsertFrmData(event);
    }
  }

  /**
   * Adding functionality for the button "Upload image"
   */
  showFileUpload() {
    this.formElements.namedItem('fsetFileUpload').classList.remove(this.cssCl2hideElm);
    this.formElements.namedItem('btShowFileUpload').classList.add(this.cssCl2hideElm);
  }

  /**
   * Adding functionality for the button "Cancel uploading"
   */
  cancelFileUpload() {
    this.formElements.namedItem('fsetFileUpload').classList.add(this.cssCl2hideElm);
    this.formElements.namedItem('btShowFileUpload').classList.remove(this.cssCl2hideElm);
  }

  /**
   * Uploads a new image to the server, closes the corresponding part of the form, and adds the URL of the image to the form.
   */
  uploadImg() {
    const files = this.formElements.namedItem("flElm").files;

    if (files.length > 0) {
      const imgLinkElement = this.formElements.namedItem("imageLink");
      const fieldsetElement = this.formElements.namedItem("fsetFileUpload");
      const btShowFileUploadElement = this.formElements.namedItem("btShowFileUpload");

      // Gather the image file data
      let imgData = new FormData();
      imgData.append("file", files[0]);

      // Set up the request
      const postReqSettings = {
        method: 'POST',
        body: imgData
      };            // Execute the request
      fetch(`${this.serverUrl}/fileUpload`, postReqSettings)
        .then(response => {
          if (response.ok) {
            return response.json();
          } else {
            return Promise.reject(new Error(`Server answered with ${response.status}: ${response.statusText}.`));
          }
        })
        .then(responseJSON => {
          imgLinkElement.value = responseJSON.fullFileUrl;
          btShowFileUploadElement.classList.remove(this.cssCl2hideElm);
          fieldsetElement.classList.add(this.cssCl2hideElm);
        })
        .catch(error => {
          window.alert(`Image uploading failed. ${error}.`);
        });
    } else {
      window.alert("Please, choose an image file.");
    }
  }

  /**
   * Process form data and sends the updated article to the server
   * @param event - event object, to prevent default processing
   */
  processArtEditFrmData(event) {
    event.preventDefault();

    const articleData = {
      title: this.formElements.namedItem("title").value.trim(),
      content: this.formElements.namedItem("content").value.trim(),
      author: this.formElements.namedItem("author").value.trim(),
      imageLink: this.formElements.namedItem("imageLink").value.trim(),
      tags: this.formElements.namedItem("tags").value.trim()
    };

    if (!(articleData.title && articleData.content)) {
      window.alert("Please, enter article title and content");
      return;
    }

    if (!articleData.author) {
      articleData.author = "Anonymous";
    }

    if (!articleData.imageLink) {
      delete articleData.imageLink;
    }

    if (!articleData.tags) {
      delete articleData.tags;
    } else {
      articleData.tags = articleData.tags.split(",").map(tag => tag.trim()).filter(tag => tag);
      if (articleData.tags.length === 0) {
        delete articleData.tags;
      }
    }

    fetch(`${this.serverUrl}/article/${this.articleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json;charset=utf-8' },
      body: JSON.stringify(articleData)
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then(() => {
        window.alert("Updated article successfully saved on server");
        window.location.hash = `#article/${this.articleId}`;
      })
      .catch(error => {
        window.alert(`Failed to save the updated article on server. ${error}`);
      });
  }


  /**
   * Process form data and sends the new article to the server
   * @param event - event object, to prevent default processing
   */
  processArtInsertFrmData(event) {
    event.preventDefault();
    this.sendArticleData('POST', `${this.serverUrl}/article`, "New article successfully added to the server");
  }

  /**
   * General method to send article data to the server
   * @param method - HTTP method (POST or PUT)
   * @param url - API endpoint URL
   * @param successMessage - Message to display on successful operation
   */
  sendArticleData(method, url, successMessage) {
    // Gather and check the form data
    const articleData = {
      title: this.formElements.namedItem("title").value.trim(),
      content: this.formElements.namedItem("content").value.trim(),
      author: this.formElements.namedItem("author").value.trim(),
      imageLink: this.formElements.namedItem("imageLink").value.trim(),
      tags: this.formElements.namedItem("tags").value.trim()
    };        if (!(articleData.title && articleData.content)) {
      window.alert("Please, enter article title and content");
      return;
    }

    if (!articleData.author) {
      articleData.author = "Anonymous";
    }

    if (!articleData.imageLink) {
      delete articleData.imageLink;
    }

    if (!articleData.tags) {
      delete articleData.tags;
    } else {
      articleData.tags = articleData.tags.split(",").map(tag => tag.trim()).filter(tag => tag);
      if (articleData.tags.length === 0) {
        delete articleData.tags;
      }
    }

    // Set up the request
    const postReqSettings = {
      method: method,
      headers: {
        'Content-Type': 'application/json;charset=utf-8'
      },
      body: JSON.stringify(articleData)
    };

    // Execute the request
    fetch(url, postReqSettings)
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          return Promise.reject(new Error(`Server answered with ${response.status}: ${response.statusText}.`));
        }
      })
      .then(() => {
        window.alert(successMessage);
        window.location.hash = `#articles`;
      })
      .catch(error => {
        window.alert(`Failed to save the article on server. ${error}`);
      });
  }
}
