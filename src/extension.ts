/*
 * Copyright (c) 2024 Jaime HR
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */


import * as vscode from 'vscode';
import * as child_process from 'child_process';

let nodeServerTerminal: vscode.Terminal | undefined;

export function activate(context: vscode.ExtensionContext) {
  let startCommand = vscode.commands.registerCommand('extension.startNodeServer', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No file is open.');
      return;
    }

    const document = editor.document;
    const filePath = document.fileName;

    if (document.languageId !== 'javascript') {
      vscode.window.showErrorMessage('The opened file is not a JavaScript file.');
      return;
    }

    if (document.isUntitled) {
      vscode.window.showErrorMessage('The file must be saved before it can be executed.');
      return;
    }

    if (document.isDirty) {
      const save = await document.save();
      if (!save) {
        vscode.window.showErrorMessage('Failed to save the file.');
        return;
      }
    }

    if (!isNodeInstalled()) {
      vscode.window.showErrorMessage('Node.js is not installed on your system. Please install it to run the Node.js server.');
      return;
    }

    if (nodeServerTerminal) {
      nodeServerTerminal.dispose();
    }

    nodeServerTerminal = vscode.window.createTerminal('Node Server');
    nodeServerTerminal.sendText(`NODE_NO_WARNINGS=1 node --watch ${filePath}`);
    vscode.window.showInformationMessage('Node.js server started successfully.');
    nodeServerTerminal.show();
  });

  let stopCommand = vscode.commands.registerCommand('extension.stopNodeServer', () => {
    if (nodeServerTerminal) {
      nodeServerTerminal.dispose();
      nodeServerTerminal = undefined;
      vscode.window.showInformationMessage('Node.js server stopped.');
    } else {
      vscode.window.showErrorMessage('No Node.js server is currently running.');
    }
  });

  context.subscriptions.push(startCommand);
  context.subscriptions.push(stopCommand);
}

export function deactivate() {
  if (nodeServerTerminal) {
    nodeServerTerminal.dispose();
  }
}

function isNodeInstalled(): boolean {
  try {
    const result = child_process.spawnSync('node', ['--version']);
    return result.status === 0; // If the command runs successfully, Node.js is installed
  } catch (error) {
    return false; // If there's any error, Node.js is either not installed or couldn't be executed
  }
}
