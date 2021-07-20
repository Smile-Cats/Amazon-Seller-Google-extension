// 下载子asin 特定date的 businessReport
function businessReport(seller, date, n=0) {
  if (n>3) {
    console.log(date + "获取数据失败")
    return
  }
  var fdate; n++;
  var url = '/gp/site-metrics/load/csv/BusinessReport';
  var language = document.evaluate('//select/option[@selected="selected"]/@value', document).iterateNext().value;
  if (language == "en_US") {
    fdate = format_date(date).replace('/', '%2F').replace('/', '%2F');
  } else if (language == "zh_CN") {
    fdate = date;
  }
  // var seller = 'konkou'; // 自定义店名
  var payload = "reportID=102%3ADetailSalesTrafficByChildItem&sortIsAscending=0&sortColumn=16&fromDate={0}&toDate={0}&cols=%2Fc0%2Fc1%2Fc2%2Fc3%2Fc4%2Fc5%2Fc6%2Fc7%2Fc8%2Fc9%2Fc10%2Fc11%2Fc12%2Fc13%2Fc14%2Fc15&rows=&dateUnit=1&currentPage=0&runDate=".replace('{0}', fdate).replace('{0}', fdate);
  xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      processResponse(this, date, seller);
    } else if (this.readyState == 4 && this.status == 503) {
      console.log('状态码503, 需要重试');
      businessReport(seller, date, n);
    }
  }
  xhttp.open("POST", url, true);
  xhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  xhttp.send(payload);
}

// 获取店铺名称并启动抓取程序
function start(func) {
  xhttp = new XMLHttpRequest();
  var startdate = arguments[1]; var enddate = arguments[2];
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      var seller = JSON.parse(this.responseText).partnerAccounts[0].name;
      if (seller) {
        func(seller, startdate, enddate);
      } else {
        console.log("未提取到店铺名称");
      }  
    }
  }
  xhttp.open("POST", "/partner-dropdown/data/get-partner-accounts?stck=na");
  xhttp.setRequestHeader("Content-Type", "application/json");
  xhttp.send(JSON.stringify({"delegationContext":"","pageSize":10}));
}

// 对下载的子asin报告进行处理
function processResponse(xhttp, date, seller) {
  // Chrome提供的大部分API是不支持在content_scripts中运行
  // sendMessage onMessage 是可以使用
  chrome.runtime.sendMessage({
    report: xhttp.responseText,
    date: date,
    seller: seller
   }, function(response){
     if (response == "数据为空") {
      window.alert(date + ' 数据下载失败');
     } else {
      console.log('收到来自后台的回复：'+ response);
      window.alert(date + ' amazonBusinessReport已下载');
      localStorage.report = today();
     }
   });

  // console.log(xhttp.responseText) 
}

// startDate: 计划开始时间； endDate：计划结束时间；dayLength：每隔几天，0-代表每天，1-代表日期间隔一天
function getDateStr(startDate, endDate, dayLength) {
	var str = startDate;
	for (var i = 0 ;; i++) {
		var getDate = getTargetDate(startDate, dayLength);
		startDate = getDate;
		if (getDate <= endDate) {
			str += ','+getDate;
		} else {
			break;
		}
	}
	// console.log(str);
  return str
}

// startDate: 开始时间；dayLength：每隔几天，0-代表获取每天，1-代表日期间隔一天
function getTargetDate(date,dayLength) {
	  dayLength = dayLength + 1;
    var tempDate = new Date(date);
    tempDate.setDate(tempDate.getDate() + dayLength);
    var year = tempDate.getFullYear();
    var month = tempDate.getMonth() + 1 < 10 ? "0" + (tempDate.getMonth() + 1) : tempDate.getMonth() + 1;
    var day = tempDate.getDate() < 10 ? "0" + tempDate.getDate() : tempDate.getDate();
    return year + "-" + month + "-" + day;
}

// 格式化日期，由 '2021-01-10' => '01/10/2021'
function format_date(date) {
  date_array = date.split('-');
  year = date_array[0]; month=date_array[1]; date=date_array[2];
  new_date = month + '/' + date + '/' + year
  return new_date
}

// 获取当天日期
function today() {
  var tempDate = new Date();
  var year = tempDate.getFullYear();
  var month = tempDate.getMonth() + 1 < 10 ? "0" + (tempDate.getMonth() + 1) : tempDate.getMonth() + 1;
  var day = tempDate.getDate() < 10 ? "0" + tempDate.getDate() : tempDate.getDate();
  return year + "-" + month + "-" + day;
}

// 获取2021年的历史数据
function historyReport(seller) {
  var yesterday = getTargetDate(today(), -3);
  var day_s = getDateStr('2021-01-01', yesterday, 0);
  var dayArray = day_s.split(',');
  for (i in dayArray) {
    setTimeout(businessReport(seller, dayArray[i]), Math.random()*5*1000) // 随机等待1~5秒发送请求
  }
}

// 获取前日数据
function yesterdayReport(seller) {
  var yesterday = getTargetDate(today(), -3);
  businessReport(seller, yesterday);
}

// 获取前7天数据
function last7dReport(seller) {
  var yesterday = getTargetDate(today(), -3);
  var yester7day = getTargetDate(today(), -10);
  var day_s = getDateStr(yester7day, yesterday, 0);
  var dayArray = day_s.split(',');
  for (i in dayArray) {
    setTimeout(businessReport(seller, dayArray[i]), Math.random()*5*1000) // 随机等待1~5秒发送请求
  }
}

// 获取特定日期范围数据
function rangeReport(seller, startdate, enddate) {
  var day_s = getDateStr(startdate, enddate, 0);
  var dayArray = day_s.split(',');
  for (i in dayArray) {
    setTimeout(businessReport(seller, dayArray[i]), Math.random()*5*1000) // 随机等待1~5秒发送请求
  }
}

// 监听来自home.html的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
  if (request.start != "" && request.end != "") {
    console.log("开始下载" + request.start + "~" + request.end + "数据");
    start(rangeReport, request.start, request.end);
  } 
});

if (localStorage.report != today()) {
  start(yesterdayReport);
  // start(last7dReport);
} else {
  console.log("今日不再下载 amazonBusinessReport");
}