$(document).ready(function () {
  // This file just does a GET request to figure out which user is logged in
  // and updates the HTML on the page



  // get the list of the employess on the dashboard
  // $.get("/api/timesheet").then(function (dbTimeSheet) {

  //   console.log(dbTimeSheet[0].id)
  //   for (let index = 0; index < dbTimeSheet.length; index++) {


  //   }
  // });
  var days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function convert_date(date) {
    if(date) return `${days[new Date(date).getDay() - 1]} ${new Date(date).getDate()} ${months[new Date(date).getMonth()]} ${new Date(date).getFullYear()} ${new Date(date).getHours()}:${new Date(date).getMinutes()}:${new Date(date).getSeconds()}`;
    else return '';
  }

  $.ajax({
    method: 'GET',
    url: '/api/timesheet_employerId',
    //Then
  }).then(data => {
    console.log(data);
    var html = '';
    var i;
    for (i = 0; i < data.length; i++) {
      html += '<tr>' +
        '<td>' + data[i].EmployeeId + '</td>' +
        '<td>' + data[i].employee.employeeName + '</td>' +
        '<td>' + data[i].employeeStatus + '</td>' +
        '<td>' + convert_date(data[i].check_in) + '</td>' +
        '<td>' + convert_date(data[i].check_out) + '</td>' + '</tr>'
      $('#table_body').html(html);
    }

  })

});

  // 


