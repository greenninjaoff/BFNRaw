"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.me = me;
exports.updateProfile = updateProfile;
exports.changePassword = changePassword;
exports.requestReset = requestReset;
exports.resetPassword = resetPassword;
const authService = __importStar(require("./auth.service"));
const notify_1 = require("../../lib/notify");
async function register(req, res) {
    try {
        const { phone, password, fullName } = req.body;
        if (!phone || !password) {
            res.status(400).json({ error: "Phone and password required" });
            return;
        }
        const result = await authService.register(phone.trim(), password, fullName?.trim());
        res.status(201).json(result);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
}
async function login(req, res) {
    try {
        const { phone, password } = req.body;
        if (!phone || !password) {
            res.status(400).json({ error: "Phone and password required" });
            return;
        }
        res.json(await authService.login(phone.trim(), password));
    }
    catch (err) {
        res.status(401).json({ error: err.message });
    }
}
async function me(req, res) {
    try {
        res.json(await authService.me(req.userId));
    }
    catch (err) {
        res.status(404).json({ error: err.message });
    }
}
async function updateProfile(req, res) {
    try {
        const { fullName, phone } = req.body;
        const user = await authService.updateProfile(req.userId, { fullName, phone });
        await (0, notify_1.createNotification)(req.userId, "INFO", "Profile updated", "Your account information was updated.");
        res.json(user);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
}
async function changePassword(req, res) {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            res.status(400).json({ error: "Both passwords required" });
            return;
        }
        await authService.changePassword(req.userId, currentPassword, newPassword);
        await (0, notify_1.createNotification)(req.userId, "SYSTEM", "Password changed", "Your password was changed. If this wasn't you, contact support immediately.");
        res.json({ success: true });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
}
async function requestReset(req, res) {
    try {
        const { phone } = req.body;
        if (!phone) {
            res.status(400).json({ error: "Phone required" });
            return;
        }
        const code = await authService.requestPasswordReset(phone.trim());
        const isDev = process.env.NODE_ENV !== "production";
        res.json({ success: true, ...(isDev ? { code } : {}) });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
}
async function resetPassword(req, res) {
    try {
        const { phone, code, newPassword } = req.body;
        if (!phone || !code || !newPassword) {
            res.status(400).json({ error: "phone, code, newPassword required" });
            return;
        }
        await authService.resetPassword(phone.trim(), code.trim(), newPassword);
        res.json({ success: true });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
}
