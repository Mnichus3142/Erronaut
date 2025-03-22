import boxen from 'boxen';
import chalk from 'chalk';

interface ErrorDetails {
    message?: string;
    code?: string | number;
    details?: any;
    [key: string]: any;
}

declare global {
    interface Error {
        details?: ErrorDetails;
    }

    interface ErrorConstructor {
        new (input: string | ErrorDetails): Error;
        (input: string | ErrorDetails): Error;
    }
}

export class ErrorHandler {
    private static instance: ErrorHandler;

    private static readonly boxenOptions = {
        padding: 1,
        width: process.stdout.columns,
        borderStyle: "round" as const,
        borderColor: 'red'
    };
  
    private constructor() {
        const originalError = global.Error;
        global.Error = function(input: string | ErrorDetails) {
            let message: string;
            let additionalData: ErrorDetails = {};

            if (typeof input === 'string') {
                message = input;
            } else {
                message = input.message || 'Unknown error';
                additionalData = input;
            }

            const error = new originalError(message);
            error.details = additionalData;
            
            const handler = ErrorHandler.getInstance();
            handler.handleError(error);
            return error;
        } as ErrorConstructor;

        process.on('uncaughtException', (error: Error) => {
            this.handleError(error);
        });
    
        process.on('unhandledRejection', (reason: any) => {
            this.handleError(reason instanceof Error ? reason : new Error(String(reason)));
        });
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
  
    private handleError(error: Error & { details?: ErrorDetails }): void {
      const errorTitle = chalk.bold.white.bgRgb(255, 0, 0)(` Error - ${new Date().toLocaleString()} `);
      const message = chalk.bold.rgb(255, 0, 0)(`Message: ${error.message}`);
      
      let additionalInfo = '';
      if (error.details) {
          additionalInfo = Object.entries(error.details)
              .filter(([key]) => key !== 'message')
              .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
              .join('\n');
      }

      console.log(
        boxen(
            `${errorTitle}\n\n${message}${additionalInfo ? '\n\n' + additionalInfo : ''}\n\n${this.getErrorLocation(error)}`, 
            ErrorHandler.boxenOptions
        )
      );
    }
  }