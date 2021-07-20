function saveReport(request) {
    payload = JSON.stringify(request);
    var url = 'http://ip:5002/report'
    xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      var date_ = request.date
      if (this.readyState == 4 && this.status == 200) {
        console.log(date_ + ' amazonBusinessReport已下载');
      } else if (this.readyState == 4 && this.status == 500) {
        console.log(date_ + ' 数据为空,请重新下载');
      } 
  }
  xhttp.open("POST", url, true);
  xhttp.setRequestHeader("Content-Type", "application/json");
  xhttp.send(payload);
}

// 监听来自content-script的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
  if (request.report != "") {
    sendResponse('我是后台，我已收到你的消息：'+ JSON.stringify(request));
    saveReport(request);
  } else {
    sendResponse("数据为空");
  }
});