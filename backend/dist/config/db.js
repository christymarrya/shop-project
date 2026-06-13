"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbQuery = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = require("../utils/logger");
dotenv_1.default.config();
let pool = null;
try {
    pool = promise_1.default.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'changeme',
        database: process.env.DB_NAME || 'cybersec_lab',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0
    });
    logger_1.logger.info(`Database pool initialized targeting ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
}
catch (error) {
    logger_1.logger.error('Database pool initialization critical error:', error);
}
// Wrapper for executing SQL queries
const dbQuery = async (sql, params) => {
    if (!pool) {
        const errMsg = 'Database pool is uninitialized. Ensure MySQL is running and credentials are set.';
        logger_1.logger.error(errMsg);
        throw new Error(errMsg);
    }
    try {
        const [results] = await pool.execute(sql, params);
        return results;
    }
    catch (error) {
        logger_1.logger.error(`Database query failed. SQL: "${sql}". Error: ${error.message}`);
        throw error;
    }
};
exports.dbQuery = dbQuery;
exports.default = pool;
