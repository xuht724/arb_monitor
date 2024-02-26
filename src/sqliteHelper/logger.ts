// Create a Winston logger for block-level data
import { add, createLogger, format, transports } from "winston";

export const sqliteLogger = createLogger({
    transports: [new transports.File({ filename: "./log/sqlite.log" })],
});
