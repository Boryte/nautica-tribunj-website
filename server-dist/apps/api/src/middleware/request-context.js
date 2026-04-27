"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachRequestContext = void 0;
/* eslint-disable @typescript-eslint/no-namespace */
const node_crypto_1 = __importDefault(require("node:crypto"));
const attachRequestContext = (request, response, next) => {
    request.requestId = request.header('x-request-id') ?? node_crypto_1.default.randomUUID();
    response.setHeader('x-request-id', request.requestId);
    next();
};
exports.attachRequestContext = attachRequestContext;
