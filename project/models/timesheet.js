/* eslint-disable camelcase */
module.exports = function (sequelize, DataTypes) {
  var TimeSheet = sequelize.define("TimeSheet", {
    employeeStatus: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        len: [1]
      }
    },
    // geoLocation: {
    //   type: DataTypes.GEOMETRY("POINT")
    // },
    check_in: {
      type: DataTypes.DATE,
      //   defaultValue: DataTypes.literal("CURRENT_TIMESTAMP"),
      allowNull: false
    },
    check_out: {
      type: DataTypes.DATE,
      //   defaultValue: DataTypes.literal("CURRENT_TIMESTAMP"),
      allowNull: true
    },
    EmployeeId: {
      type: DataTypes.INTEGER
    }
  });

  TimeSheet.associate = function (models) {
    // We're saying that a Post should belong to an Author
    // A Post can't be created without an Author due to the foreign key constraint
    TimeSheet.belongsTo(models.Employee, {
      foreignKey: 'EmployeeId',
      as: 'employee'
    });
  };

  return TimeSheet;
};