
/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html
  
  SPDX-License-Identifier: EPL-2.0
  
  Copyright Contributors to the Zowe Project.
*/
import { TestBed, inject } from '@angular/core/testing';

import { LanguageServerService } from './language-server.service';

describe('LanguageServerService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LanguageServerService]
    });
  });

  it('should be created', inject([LanguageServerService], (service: LanguageServerService) => {
    expect(service).toBeTruthy();
  }));
});

/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html
  
  SPDX-License-Identifier: EPL-2.0
  
  Copyright Contributors to the Zowe Project.
*/
