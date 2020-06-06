var db = require("../models");
var bcrypt = require("bcrypt");
var passport = require("../config/passport");
var fs = require('fs');
const saltRounds = 10;

module.exports = function (app) {
  /*-------------------INDEX PAGE------------------------*/
  app.post("/api/login", passport.authenticate("local"), function (req, res) {
    res.json(req.user);
  });

  /*------------------EMPLOYER PAGES--------------------*/
  // Register a new employer
  app.post("/api/signup", (req, res) => {
    console.log("test");
    db.Employer.findOne({
      where: {
        employerEmail: req.body.employerEmail
      }
    }).then(function (employer) {
      if (employer) {
        res.send(false);
      } else {
        bcrypt.hash(req.body.employerPassword, saltRounds, function (err, hash) {
          db.Employer.create({
            employerEmail: req.body.employerEmail,
            employerName: req.body.employerName,
            employerPassword: hash,
            employerCompanyName: req.body.employerCompanyName
          }).then(function (dbEmployer) {
            res.json(dbEmployer)
          }).catch((function (err) {
            res.status(401).json(err);
          }));
        });
      }
    });
  });

  // Route for getting some data about our user to be used client side
  app.get("/api/employer_data", function (req, res) {
    if (!req.user) {
      // The user is not logged in, send back an empty object
      res.json({});
    } else {
      // Otherwise send back the user's email and id
      // Sending back a password, even a hashed password, isn't a good idea
      res.json({
        email: req.user.employerEmail,
        id: req.user.id,
        company: req.user.employerCompanyName
      });
    }
  });

  /*------------------ADD EMPLOYEE PAGES--------------------*/
  app.post("/api/addEmployee", (req, res) => {
    console.log("POST ENTER SUCCESSFUL", req.body.EmployerId)

    db.Employee.create({
      employeeName: req.body.employeeName,
      employeeDepartment: req.body.employeeDepartment,
      employeePosition: req.body.employeePosition,
      employeeAddress: req.body.employeeAddress,
      employeeContactNumber: req.body.employeeContactNumber,
      employeeDOB: req.body.employeeDOB,
      employeeImage: req.body.employeeImage,
      EmployerId: req.body.EmployerId
    }).then(function (dbEmployee) {
      res.json(dbEmployee)
    }).catch((function (err) {
      res.status(401).json(err);
    }));

  });

  // PUT route for updating posts
  app.put("/api/update/:id", function (req, res) {

    db.Employee.update({
      employeeName: req.body.employeeName,
      employeeDepartment: req.body.employeeDepartment,
      employeeContactNumber: req.body.employeeContactNumber
    }, {
      where: {
        id: req.params.id
      }
    }).then(function (dbEmployee) {
      res.json(dbEmployee);
    });
  });


  app.get("/api/employees/:id", function (req, res) {
    db.Employee.findAll({
      where: {
        id: req.params.id
      }

    }).then(function (dbEmployees) {
      res.json(dbEmployees);
    });
  });

  app.get("/api/listemployees/:id", function (req, res) {
    db.Employee.findAll({

      where: {

        EmployerId: req.params.id
      }

    }).then(function (dbEmployees) {
      res.json(dbEmployees);
    });
  });

  app.get("/api/allEmployee", function (req, res) {
    db.Employee.findAll({}).then(function (dbEmployees) {
      res.json(dbEmployees);
    });
  });
  app.get("/api/timesheet", function (req, res) {
    db.TimeSheet.findAll({
      include: [
        'employee'
      ],
    }).then(function (results) {
      res.json(results);
    });
  });
  app.get("/api/timesheet_employerId", function (req, res) {
    console.log("I am employerId", req.user.id)
    db.TimeSheet.findAll({
      include: [
        'employee'
      ],
    }).then(function (results) {
      let filtered_result = results.filter(element => element.employee.EmployerId === req.user.id);
      res.json(filtered_result);
    });
  });
  app.post("/api/timesheet", function (req, res) {
    console.log(req.body)
    if (req.body.check_create === '1') {
      db.TimeSheet.create({
        EmployeeId: req.body.employeeID,
        employeeStatus: req.body.employeeStatus,
        // geoLocation: req.body.geoLocation,
        check_in: req.body.check_in,
        check_out: null
      });
    }
    else {
      db.TimeSheet.findOne({ where: { id: req.body.id } })
        .then(function (employee) {
          // Check if record exists in db
          console.log('Posting Timesheet')
          employee.update({
            employeeStatus: req.body.employeeStatus,
            check_out: req.body.check_out
          })
        })
    }
    res.status(204).end();
  });
  // Route for logging user out
  app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
  });

  // Delete an example by id
  app.delete("/api/employee/:id", function (req, res) {
    db.Employee.destroy({
      where: {
        id: req.params.id
      }
    }).then(function (dbEmployee) {
      res.json(dbEmployee);
    });
  });

  // API Routes for face recognition
  // API route for getting user's face model
  app.get("/api/getFaceData/:id", function (req, res) {
    // Grab ID of user
    var idOfUser = req.params.id;
    var fs = require("fs");
    var path = require("path");
    console.log("reading file");
    // Read data file
    db.Employee.findOne({
      // Where clause
      where: {
        id: idOfUser
      }
    }).then(function (data) {
      // Send back data contained within employee's image
      res.send(data.employeeImage);
    });
  });
  // Create a new face
  app.post("/api/addNewFace/:id", function (req, res) {
    // Assign request body to facialModel
    var idOfUser = req.params.id;
    var facialModel = req.body;
    console.log("Attempting database write");
    // Insert facial model into database
    db.Employee.update({
      employeeImage: JSON.stringify(facialModel)
    }, {
      where: {
        id: idOfUser
      }
    }).then(function () {
      // Send status 200
      res.sendStatus(200);
    }).catch(function () {
      // Send status 500
      res.sendStatus(200);
    });

  });

};