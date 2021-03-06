
/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html
  
  SPDX-License-Identifier: EPL-2.0
  
  Copyright Contributors to the Zowe Project.
*/
import { NgxMonacoEditorConfig } from 'ngx-monaco-editor';
import { MonacoService } from './monaco.service';
import { EditorServiceInstance } from '../../../shared/editor-control/editor-control.service';

import { EditorService } from '../../editor.service';
import { Subscription } from 'rxjs/Subscription';

const HLASM_LANG = {
  id: 'hlasm',
  // firstLine: 
  extensions: ['.ass', '.asm', '.hlsm', '.hlasm'],
  aliases: ['ASSEMBLY', 'assembly', 'hlsm', 'hlasm'],
  mimetypes: ['application/hlasm']
};

const JCL_LANG = {
  id: 'jcl',
  extensions: ['.jcl', '.cntl'],
  filenamePatterns: ['\\.jcl\\.','\\.jcl','\\.cntl','\\.cntl\\.'],
  aliases: ['JCL', 'jcl'],
  mimetypes: ['application/jcl']
};

const HLASM_HILITE = {
  // Set defaultToken to invalid to see what you do not tokenize yet
  // defaultToken: 'invalid',
  ignoreCase: true,

  // The main tokenizer for our languages
  tokenizer: {
    root: [
      [/^\*.*$/, { token: 'comment', next: '@popall' }],
      [/^[\w&#$@]+\s+/, { token: 'type', next: '@operator' }],
      [/^[\s]{9}/, { token: 'default', next: '@operator' }],
      [/^[\s]{15}/, { token: 'default', next: '@operands' }]
    ],
    operator: [
      [/[\w&#$@]+\s*$/, { token: 'keyword', next: '@popall' }],
      [/[\w&#$@]+\s+/, { token: 'keyword', next: '@operands' }]
    ],
    operands: [
      [/\'[^\']+\'\s*$/, { token: 'string', next: '@popall' }],
      [/\s*$/, { token: 'default', next: '@popall' }],
      [/,\s*$/, { token: 'default', next: '@popall' }],
      [/[\(\)\w&#$@]+\s*$/, { token: 'default', next: '@popall' }],
      [/,[\(\)\w&#$@]+\s*$/, { token: 'default', next: '@popall' }],
      [/,\s+[^X]*$/, { token: 'comment', next: '@popall' }],
      [/\s+[\(\)\s\w&#$@]+\s*$/, { token: 'comment', next: '@popall' }],

      [/,/, { token: 'default', next: '@cont' }],
      [/[kldtn]'[\(\)\w&#$]+/, { token: 'number', next: '@cont' }],
      [/'[^']+'/, { token: 'string', next: '@cont' }],
      [/[\w&#$@]+=/, { token: 'variable.name', next: '@value' }]
    ],
    cont: [
      [/\s*[X]$/, { token: 'keyword', next: '@pop' }],
      [/\s+[\s\.\/\(\)\w&#$@]+$/, { token: 'comment', next: '@popall' }],
      [/\)\s*$/, { token: 'default', next: '@popall' }],
      [/\(/, { token: 'default', next: '@operands' }],
      [/\)/, { token: 'default', next: '@operands' }],
      [/'[^\']+\'\s*/, { token: 'string', next: '@cont' }],
      [/[kldtn]\'[\(\)\w&#$@]+/, { token: 'number', next: '@cont' }],
      [/[\w&#$@]+=/, { token: 'variable.name', next: '@value' }],
      [/[\.\/\(\)\w&#$@]+$/, { token: 'default', next: '@popall' }],
      [/[\.\/\(\)\w&#$@]+/, { token: 'default', next: '@operands' }]
    ],
    comment: [
      [/.*$/, { token: 'comment', next: '@popall' }]
    ],
    value: [
      [/[\-\.\/\(\)\w&#$@]+$/, { token: 'default', next: '@popall' }],
      [/'[^']+'\s*/, { token: 'string', next: '@operands' }],
      [/[kldtn]\'[\(\)\w&#$@]+/, { token: 'number', next: '@operands' }],
      [/[\-\.\/\(\)\w&#$@]+/, { token: 'default', next: '@operands' }]
    ]
  }
};

const JCL_HILITE = {
// Set defaultToken to invalid to see what you do not tokenize yet
  defaultToken: 'default',
  ignoreCase: false,
  
  brackets: [ 
  ['(',')','jcl-delimiter'], ],
  

// Expand tokenizer via: https://microsoft.github.io/monaco-editor/monarch.html
  tokenizer: {
    root: [
      // [/^................................................................................[^ |\n]*/, 
      //   { token: 'jcl-invalid' }], //Checks for lines with 80+ characters
      [/^\/\/\*.*$/, { token: 'jcl-comment-//*-all' }], //Comment lasts until end of line
      [/, *$/, { token: 'jcl-delimiter', next: '@operands2' }], //Checks for end of line with a ','
      [/ *\n| *$/, { token: 'default', next: '@popall' }], //Checks for end of line without a ','
      //[/<</, { token: 'jcl-delimiter', next: '@comments'}], //Checks for << [{}()\[\]]
      //[/[()]/, { token: 'jcl-delimiter', next: '@brackets'}], 
      [/,( +)[0-9]+$/, { token: 'jcl-delimiter', next: '@operands2'}], //Checks for ',' + linenumber + linebreak (continuation of statement)
      [/( *)[0-9]+$/, { token: 'default' }], //Checks for linenumber + linebreak (new JCL statement)
      [/( +)/, { token: 'whitespace' }], //Removes any previous line spaces
      [/^\/\*/, { token: 'jcl-statement-/*', next: '@nameFirstChar' }],
      [/^\/\//, { token: 'jcl-statement-//', next: '@nameFirstChar' }],
      [/.*/, { token: 'none-slash' }], //When a token doesn't match, the line is blue
    ],
    nameFirstChar: [
      [/[ ]/, { token: 'default', next: '@operator' }], //Name must start with capital or national symbols
      [/[A-Z|@|#|$| ]/, { token: 'default', next: '@name' }], //Name must start with capital or national symbols
      [/./, { token: 'jcl-invalid', next: '@name' }], //For everything else
    ],
    name: [
      [/[A-Z|@|#|$|0-9]{8,}/, { token: 'jcl-invalid', next: '@operator' }], //Name must be between {0, 8} characters
      [/, *$/, { token: 'jcl-delimiter', next: '@operands2' }], //Checks for end of line with a ','
      [/ *\n| *$/, { token: 'default', next: '@popall' }], //Checks for end of line without a ','
      [/,( +)[0-9]+$/, { token: 'jcl-delimiter', next: '@operands2'}], //Checks for ',' + linenumber + linebreak (continuation of statement)
      [/( *)[0-9]+$/, { token: 'default', next: '@popall' }], //Checks for linenumber + linebreak (new JCL statement)
      [/( +)/, { token: 'whitespace', next: '@operator' }], //Spaces(s) designate when to check for operator keywords after name
      [/'.*'/, { token: 'jcl-string', next: '@strings' }],
      [/[^A-Z|@|#|$|0-9]/, { token: 'jcl-invalid' }], // Checks for invalid JCL characters in names
      //[/[^\s,=~!@%&_{}\]:;'<>\[\\\^\$\.\|\?\*\+\(\)]/, { token: 'jcl-variable' }],
      //[/(,|&|=|\^)/, { token: 'jcl-delimiter' }],
      // [/\(/,   { token: 'jcl-delimiter', bracket: '@open'  }],
      // [/\(/, { token: 'jcl-invalid' }],
      // [/\)/, { token: 'jcl-delimiter', bracket: '@close' }],
      // [/\)/, { token: 'jcl-invalid' }],
      [/./, { token: 'default' }]
    ],
    operator: [
      //[/( +)/, { token: 'whitespace' }],
      [/, *$/, { token: 'jcl-delimiter', next: '@operands2' }], //Checks for end of line with a ','
      [/ *\n| *$/, { token: 'default', next: '@popall' }], //Checks for end of line without a ','
      [/!/, { token: 'jcl-invalid', next: '@operands' }], // Checks for invalid JCL characters
      [/[a-z]+/, { token: 'jcl-invalid', next: '@operands' }], // Checks for invalid lowercase JCL
      [/(,|&|=|\^)/, { token: 'jcl-delimiter', next: '@operands'}],
      [/'/, { token: 'jcl-string', next: '@strings' }],
      [/[()]/, '@brackets'],
      [/(IF)/, { token: 'jcl-operator', next: '@if' }],
      [/(DD|CNTL|EXEC|JOB|INCLUDE|JCLLIB|OUTPUT|PROC|SCHEDULE|SET|XMIT|COMMAND) *$/, { token: 'jcl-operator', next: '@popall' }],
      [/(DD|CNTL|EXEC|JOB|INCLUDE|JCLLIB|OUTPUT|PROC|SCHEDULE|SET|XMIT|COMMAND) +/, { token: 'jcl-operator', next: '@operands' }],
      [/(ENDCNTL|EXPORT|ELSE|ENDIF|PEND|THEN) *$/, { token: 'jcl-operator', next: '@popall' }],
      [/(ENDCNTL|EXPORT|ELSE|ENDIF|PEND|THEN) +/, { token: 'jcl-operator', next: '@comments' }],
      [/[^\s\\a-z(,|&|=|\^)]+/, { token: 'default', next: '@operands'}], //Matches the
      //[/..../, { token: 'default', next: '@operands' }],
    ],
    if: [
      [/, *$/, { token: 'jcl-delimiter', next: '@operands2' }], //Checks for end of line with a ','
      [/ *\n| *$/, { token: 'default', next: '@popall' }], //Checks for end of line without a ','
      [/(THEN )/, { token: 'jcl-operator', next: '@comments' }],
      [/./, { token: 'jcl-variable' }],
    ],
    operands: [
      //^( .+)
      // [/^( .+)/, { token: 'none-slash'}],
      // [/^\/\/\*.*$/, { token: 'jcl-comment-//*-all' }],
      // [/^\/\*/, { token: 'jcl-statement-/*', next: '@operands' }],
      // [/^\/\/ +[^\s,=~!@%&_{}\]:;"'<>\[\\\^\$\.\|\?\*\+\(\)]+ /, { token: 'jcl-statement-//-one', next: '@operator' }],
      // [/^\/\/(\S+)?/, { token: 'jcl-statement-//one', next: '@operator' }],
      [/,( +)[0-9]+$/, { token: 'jcl-delimiter', next: '@operands2'}], //Checks for ',' + linenumber + linebreak (continuation of statement)
      [/( *)[0-9]+$/, { token: 'default', next: '@popall' }], //Checks for linenumber + linebreak (new JCL statement)
      [/, *$/, { token: 'jcl-delimiter', next: '@operands2' }], //Checks for end of line with a ','
      [/ *\n| *$/, { token: 'default', next: '@popall' }], //Checks for end of line without a ','
      [/, /, { token: 'jcl-delimiter', next: '@comments' }], //Checks for , + space (leads to comment)
      [/'/, { token: 'jcl-string', next: '@strings' }],
      [/!/, { token: 'jcl-invalid' }], // Checks for invalid JCL characters
      [/[a-z]+/, { token: 'jcl-invalid' }], // Checks for invalid lowercase JCL
      // [/[^\s,=~!@%&_{}\]:;'<>\[\\\^\$\.\|\?\*\+\(\)]+ /, { token: 'jcl-variable', next: '@comments'}],
      // [/[^\s,=~!@%&_{}\]:;'<>\[\\\^\$\.\|\?\*\+\(\)]+/, { token: 'jcl-variable' }],
      [/(,|&|=|\^)/, { token: 'jcl-delimiter' }],
      [/[()]/, '@brackets'],
      [/ /, { token: 'jcl-variable', next: '@comments' }],//Space leads to comments
      [/./, { token: 'jcl-variable' }],//For everything else
      // [/'[^']+'\s*$/, { token: 'string', next: '@popall' }],
      // [/[^,]$/, { token: 'default', next: '@popall' }]
    ],
    operands2: [ //JCL has a behavior where it will accept two sets of operands before detecting comments
                 //for certain conditions, usually when statements are continued via a ','
      [/, *$/, { token: 'jcl-delimiter', next: '@operands2' }], //Checks for end of line with a ','
      [/ *\n| *$/, { token: 'default', next: '@popall' }], //Checks for end of line without a ','
      [/,( +)[0-9]+$/, { token: 'jcl-delimiter', next: '@operands2'}], //Checks for ',' + linenumber + linebreak (continuation of statement)
      [/( *)[0-9]+$/, { token: 'default', next: '@popall' }], //Checks for linenumber + linebreak (new JCL statement)
      [/, /, { token: 'jcl-delimiter', next: '@comments' }], //Checks for , + space (leads to comment)
      [/'/, { token: 'jcl-string', next: '@strings' }],
      [/!/, { token: 'jcl-invalid' }], // Checks for invalid JCL characters
      [/[a-z]+/, { token: 'jcl-invalid' }], // Checks for invalid lowercase JCL
      // [/[^\s,=~!@%&_{}\]:;'<>\[\\\^\$\.\|\?\*\+\(\)]+ /, { token: 'jcl-variable', next: '@comments'}],
      // [/[^\s,=~!@%&_{}\]:;'<>\[\\\^\$\.\|\?\*\+\(\)]+/, { token: 'jcl-variable' }],
      [/(,|&|=|\^)/, { token: 'jcl-delimiter' }],
      // [/[(]/, { token: 'jcl-delimiter', bracket: '@open' }],
      // [/[)]/, { token: 'jcl-delimiter', bracket: '@close' }],
      [/[()]/, '@brackets'],
      [/ +/, { token: 'jcl-variable', next: '@operands' }],//Space leads to next operand
      [/\//, { token: 'jcl-variable' }],
      [/^.*/, { token: 'none-slash' }], //When a token doesn't match, the line is blue
      [/./, { token: 'jcl-variable' }],//For everything else
    ],
    comments: [
      [/.*/, { token: 'jcl-comment-//*-all', next: '@popall' }],
      [/ *\n| *$/, { token: 'default', next: '@popall' }],
    ],
    strings: [ //Strings get their own category because Monaco doesn't seem to deal with pattern matching
              //over line breaks, even with multiline flags. This way, we just put strings into their own loop.
      [/.*' /, { token: 'jcl-string', next: '@comments' }], // Space after the ending (') character is a comment
      [/.*' */, { token: 'jcl-string', next: '@operands' }], // Covers all characters in string until ending (') character
      [/.*/, { token: 'jcl-string' }],
    ]
  }
};

export type Theme = monaco.editor.IStandaloneThemeData;

export const JCL_THEME: Theme = {
  base: 'vs-dark',
  inherit: true,
  colors: {
  },
	rules: [ // The following ruleset aims to match a JCL theme similar to one in ISPF
    { token: 'jcl-comment-//*-all', foreground: '20e5e6' }, // Light blue
    { token: 'jcl-statement-//', foreground: '50eb24' }, // Green
    { token: 'jcl-statement-/*', foreground: '50eb24' }, // Green
    { token: 'jcl-statement-//one', foreground: '50eb24' }, // Green
    { token: 'jcl-statement-//-one', foreground: '50eb24' }, // Green
    { token: 'jcl-operator', foreground: 'eb2424' }, // Red
    { token: 'jcl-delimiter', foreground: 'fffd23' }, // Yellow
    { token: 'jcl-string', foreground: 'fdfdfd' }, // White
    { token: 'jcl-variable', foreground: '50eb24' }, // Green
    { token: 'jcl-invalid', foreground: 'ffadc7', background: 'ff8173', fontStyle: 'bold' }, // Light red, background is supposed to be "highlight" 
    //of text but it doesn't seem to work?
    { token: 'none-slash', foreground: '815aff' }, // Blue-Purple
    { token: 'default', foreground: '50eb24' }, // Green
	]
}

export class MonacoConfig {
  subscription: Subscription = null;
  config = {
    baseUrl: '../../org.zowe.editor/web/assets', // configure base path for monaco editor
    defaultOptions: { scrollBeyondLastLine: false }, // pass default options to be used
    onMonacoLoad: this.onLoad.bind(this),
  };

  onLoad() {
    let self = this;
    // This step only happens once per editor load, not once per file load. It happens before language menu is generated
    monaco.languages.register(HLASM_LANG);
    monaco.languages.register(JCL_LANG);
    
    monaco.languages.setMonarchTokensProvider('hlasm', <any>HLASM_HILITE);
    monaco.languages.setMonarchTokensProvider('jcl', <any>JCL_HILITE);

    monaco.editor.defineTheme('jcl', JCL_THEME);

    // set monaco after all done
    this.subscription = EditorServiceInstance.subscribe((editorService) => {
      if (editorService != null) {
        if (editorService._isTestLangMode) {
          console.log(`Adding test language`);
          editorService.registerLanguage({
            id: 'TEST_LANGUAGE',
            extensions: ['.editortest'],
            aliases: ['TEST_LANGUAGE']
          });
        }

        editorService._editorCore.next((<any>window).monaco);
        if (self.subscription) { self.subscription.unsubscribe(); }
      }
    });
  }
}

/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html
  
  SPDX-License-Identifier: EPL-2.0
  
  Copyright Contributors to the Zowe Project.
*/
