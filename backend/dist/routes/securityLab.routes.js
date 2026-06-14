"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const securityLab_controller_1 = require("../controllers/securityLab.controller");
const router = (0, express_1.Router)();
router.post('/sql-injection/login-vulnerable', securityLab_controller_1.vulnerableLogin);
router.post('/sql-injection/login-secure', securityLab_controller_1.secureLogin);
exports.default = router;
