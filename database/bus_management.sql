-- Smart Bus Scheduling and Route Management System Database Schema
-- Database Name: bus_management

CREATE DATABASE IF NOT EXISTS `bus_management`;
USE `bus_management`;

-- --------------------------------------------------------
-- Table structure for table `Admin`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `Admin`;
CREATE TABLE `Admin` (
  `AdminID` INT AUTO_INCREMENT,
  `Name` VARCHAR(100) NOT NULL,
  `Email` VARCHAR(100) NOT NULL UNIQUE,
  `Password` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`AdminID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `Bus`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `Bus`;
CREATE TABLE `Bus` (
  `BusID` INT AUTO_INCREMENT,
  `BusNumber` VARCHAR(50) NOT NULL UNIQUE,
  `DriverName` VARCHAR(100) NOT NULL,
  `DriverContact` VARCHAR(20) NOT NULL,
  `Capacity` INT NOT NULL,
  `BusType` VARCHAR(50) NOT NULL,
  `Status` VARCHAR(20) NOT NULL DEFAULT 'Active',
  PRIMARY KEY (`BusID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `Route`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `Route`;
CREATE TABLE `Route` (
  `RouteID` INT AUTO_INCREMENT,
  `Source` VARCHAR(100) NOT NULL,
  `Destination` VARCHAR(100) NOT NULL,
  `Distance` DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (`RouteID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `Schedule`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `Schedule`;
CREATE TABLE `Schedule` (
  `ScheduleID` INT AUTO_INCREMENT,
  `BusID` INT NOT NULL,
  `RouteID` INT NOT NULL,
  `DepartureTime` TIME NOT NULL,
  `ArrivalTime` TIME NOT NULL,
  `Status` VARCHAR(20) NOT NULL DEFAULT 'Active',
  PRIMARY KEY (`ScheduleID`),
  KEY `fk_schedule_bus` (`BusID`),
  KEY `fk_schedule_route` (`RouteID`),
  CONSTRAINT `fk_schedule_bus` FOREIGN KEY (`BusID`) REFERENCES `Bus` (`BusID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_schedule_route` FOREIGN KEY (`RouteID`) REFERENCES `Route` (`RouteID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Seeding Default Admin
-- Default Login Credentials:
-- Email: admin@smartbus.com
-- Password: admin123 (hashed with bcrypt: $2a$10$uS2gGCOe0E/Y.a0e/3D5A.rGg7G5jVn6u3u4g.hQ4bF9Q0nBvU2yG)
-- --------------------------------------------------------
INSERT INTO `Admin` (`Name`, `Email`, `Password`) VALUES
('System Admin', 'admin@smartbus.com', '$2a$10$uS2gGCOe0E/Y.a0e/3D5A.rGg7G5jVn6u3u4g.hQ4bF9Q0nBvU2yG')
ON DUPLICATE KEY UPDATE `Email`=`Email`;

-- --------------------------------------------------------
-- Seeding Initial Buses
-- --------------------------------------------------------
INSERT INTO `Bus` (`BusNumber`, `DriverName`, `DriverContact`, `Capacity`, `BusType`, `Status`) VALUES
('KA-01-F-1234', 'Ramesh Kumar', '9876543210', 45, 'AC Seater', 'Active'),
('KA-01-F-5678', 'Suresh Singh', '9876543211', 32, 'Non-AC Seater', 'Active'),
('KA-02-G-4321', 'Anil Sharma', '9876543212', 40, 'AC Sleeper', 'Active'),
('KA-03-H-8765', 'Vikram Rathore', '9876543213', 50, 'Non-AC Sleeper', 'Inactive');

-- --------------------------------------------------------
-- Seeding Initial Routes
-- --------------------------------------------------------
INSERT INTO `Route` (`Source`, `Destination`, `Distance`) VALUES
('Majestic, Bangalore', 'Electronic City, Bangalore', 22.50),
('Kalyan Nagar, Bangalore', 'Whitefield, Bangalore', 18.20),
('Kempegowda Int Airport', 'Hebbal, Bangalore', 28.00),
('Silk Board, Bangalore', 'Bannerghatta, Bangalore', 15.40);

-- --------------------------------------------------------
-- Seeding Initial Schedules
-- --------------------------------------------------------
INSERT INTO `Schedule` (`BusID`, `RouteID`, `DepartureTime`, `ArrivalTime`, `Status`) VALUES
(1, 1, '08:30:00', '09:30:00', 'Active'),
(2, 2, '09:00:00', '10:15:00', 'Active'),
(3, 3, '14:30:00', '15:30:00', 'Active'),
(1, 4, '17:30:00', '18:45:00', 'Active');
