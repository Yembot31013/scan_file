let container = document.querySelector(".container");
let dragArea = document.querySelector(".drag-area");
let dragText = document.querySelector(".header");
let btn = document.querySelector(".btns");
let input = document.querySelector(".input");
let passwd = document.querySelector(".passwd");
let file;
let text_preloader;

btn.onclick = () => {
  input.click();
}

function analyzeFile(link) {
  var link = link
  $.ajax({
    type: "GET",
    url: 'https://yembot-api.vercel.app/analyze',
    data: {
      link: link
    },
    // dataType: "dataType",
    success: function (response) {
      text_preloader.textContent = "analyzing..."
      if (response.data.attributes.status != "completed"){
        text_preloader = document.querySelector("#swal2-title");
        text_preloader.textContent = "fetching result..."
        analyzeFile(link)
      }
      var link = response["data"]["links"]["item"]
      localStorage.clear()
      localStorage.setItem("analyze", link)
      window.location.href = "/results.html"
    },
    error: function(err){
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Something went wrong!\n Error code: 31013',
        footer: '<a href="https://codewithyembot.vercel.app">Why do I have this issue? Contact Me!</a>'
      })
    }
    
  });
}

//for file less than 32MB,
function scanSmallFile(folder) {
  let password= passwd.value
  var formData = new FormData();
  formData.append('file', folder);
  if (password){
    formData.append('password', password);
  }
  formData.append('password', "");

  $.ajax({
    type: 'POST',
    url: 'https://yembot-api.vercel.app/scan_file',
    // headers: {
    //   'password': password
    // },
    data: formData,
    processData: false,
    contentType: false,
    success: function(response) {
      text_preloader.textContent = "pending..."
      var link = response["data"]["links"]["self"]
      analyzeFile(link)
    },
    error: function(xhr, textStatus, errorThrown) {
      console.log('small')
      console.log(xhr)
      console.log(textStatus)
      console.log(errorThrown)
      console.log(xhr.status)
      if (xhr.status === 413) {
        // Handle the 413 error here
        Swal.fire({
          icon: 'warning',
          title: 'Oops...',
          text: 'File too large',
          footer: '<a href="https://codewithyembot.vercel.app">Why do I have this issue? Contact Me!</a>'
        })
      } else {
        text_preloader.textContent = "error"
        dragText.textContent = "Drag & Drop zip file";
        dragArea.classList.remove("cos")
        dragArea.classList.remove("cus")
        dragArea.classList.remove("cust")
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'Something went wrong!\n Error code: 31013',
          footer: '<a href="https://codewithyembot.vercel.app">Why do I have this issue? Contact Me!</a>'
        })
      }
    }
  });
}
//for file bigger than 32MB, which admits files up to 650MB.
function scanBigFile(folder) {
  let password= passwd.value
  var formData = new FormData();
  formData.append('file', folder);
  if (password){
    formData.append('password', password);
  }
  formData.append('password', "");

  $.ajax({
    type: 'POST',
    url: 'https://yembot-api.vercel.app/scan_big_file',
    // headers: {
    //   'password': password
    // },
    data: formData,
    processData: false,
    contentType: false,
    success: function(response) {
      text_preloader.textContent = "pending..."
      var link = response["data"]["links"]["self"]
      analyzeFile(link)
    },
    error: function(xhr, textStatus, errorThrown) {
      console.log('big')
      console.log(xhr)
      console.log(textStatus)
      console.log(errorThrown)
      console.log(xhr.status)
      if (xhr.status === 413) {
        // Handle the 413 error here
        Swal.fire({
          icon: 'warning',
          title: 'Oops...',
          text: 'File too large',
          footer: '<a href="https://codewithyembot.vercel.app">Why do I have this issue? Contact Me!</a>'
        })
      } else {
        text_preloader.textContent = "error"
        dragText.textContent = "Drag & Drop zip file";
        dragArea.classList.remove("cos")
        dragArea.classList.remove("cus")
        dragArea.classList.remove("cust")
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'Something went wrong!\n Error code: 31013',
          footer: '<a href="https://codewithyembot.vercel.app">Why do I have this issue? Contact Me!</a>'
        })
      }
    }
  });
}
function compareFileSize(fileContent) {
  console.log(fileContent)
    var megabytes = fileContent.size / (1024 * 1024);
    mb = parseInt(megabytes);
    text_preloader.textContent = "Scanning...";
    if (mb > 32){
      scanBigFile(fileContent)
    }
    else{
      scanSmallFile(fileContent);
    }
}

input.addEventListener("change", function (){
  dragText.textContent = "Uploaded sucessfully!";
  dragArea.classList.remove("cus")
  dragArea.classList.add("cos")
  dragArea.classList.remove("cust")
  let folder = this.files[0];
  if (folder.type == "application/zip" || folder.type === "application/x-zip-compressed") {
    Swal.fire({
      title: 'Scanning!',
      html: 'Please relax while I get some coffee!!!',
      timerProgressBar: true,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading()
      }
    })
    text_preloader = document.querySelector("#swal2-title");
    text_preloader.textContent = "Compressing File..."
    compareFileSize(folder)
  }
  else {
    dragText.textContent = "Unsupported format";
    dragArea.classList.remove("cus")
    dragArea.classList.remove("cos")
    dragArea.classList.add("cust")
    Swal.fire(
      "BadRequest!!!",
      "Unsupported format, compress to Zip first",
      "warning"
    )
  }
})

container.addEventListener("dragover", (e) => {
  e.preventDefault();
  dragText.textContent = "Release to Upload";
  dragArea.classList.remove("cos")
  dragArea.classList.add("cus")
  dragArea.classList.remove("cust")
})
container.addEventListener("dragleave", (e) => {
  dragText.textContent = "Drag & Drop zip file";
  dragArea.classList.remove("cos")
  dragArea.classList.remove("cus")
  dragArea.classList.remove("cust")
})
container.addEventListener("drop", (e) => {
  e.preventDefault();
  dragText.textContent = "Uploaded sucessfully!";
  dragArea.classList.remove("cus")
  dragArea.classList.add("cos")
  dragArea.classList.remove("cust")
  let folder = e.dataTransfer.files[0];
  if (folder.type == "application/zip" || folder.type === "application/x-zip-compressed") {
    Swal.fire({
      title: 'Scanning!',
      html: 'Please relax while I get some coffee!!!',
      timerProgressBar: true,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading()
      }
    })
    text_preloader = document.querySelector("#swal2-title");
    text_preloader.textContent = "Compressing File..."
    compareFileSize(folder)
  }
  else {
    dragText.textContent = "Unsupported format";
    dragArea.classList.remove("cus")
    dragArea.classList.remove("cos")
    dragArea.classList.add("cust")
    Swal.fire(
      "BadRequest!!!",
      "Unsupported format, compress to Zip first",
      "warning"
    )
  }
})
