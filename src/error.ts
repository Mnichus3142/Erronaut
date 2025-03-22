import boxen from 'boxen';
import chalk from 'chalk';

export class ErrorHandler {
    private static instance: ErrorHandler;

    private static readonly boxenOptions = {
        padding: 1,
        width: process.stdout.columns,
        borderStyle: "round" as const,
        borderColor: 'red'
    };
  
    private constructor() {
      process.on('uncaughtException', (error: Error) => {
        this.handleError(error);
      });
  
      process.on('unhandledRejection', (reason: any) => {
        this.handleError(reason instanceof Error ? reason : new Error(String(reason)));
      });
  
      const originalError = global.Error;
      global.Error = function(...args: any[]) {
        const error = new originalError(...args);
        const handler = ErrorHandler.getInstance();
        handler.handleError(error);
        return error;
      } as any;
    }
  
    static getInstance(): ErrorHandler {
      if (!ErrorHandler.instance) {
        ErrorHandler.instance = new ErrorHandler();
      }
      return ErrorHandler.instance;
    }

    private getErrorLocation(error: Error): string {
        if (error.stack) {
          const stack = error.stack.split('\n');
          if (stack.length > 1) {
            return stack[1];
          }
        }
        return '';
      }
  
    private handleError(error: Error): void {
      const errorTitle = chalk.bold.white.bgRgb(255, 0, 0)(` Error - ${new Date().toLocaleString()} `);
      const message = chalk.bold.rgb(255, 0, 0)(`Message: ${error.message}`);
      console.log(
        boxen(
            `${errorTitle}\n\n${message}\n\n${this.getErrorLocation(error)}`, 
            ErrorHandler.boxenOptions
        )
      );
    }
  }