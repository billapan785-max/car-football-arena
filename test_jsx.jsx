import React from 'react';
import { renderToString } from 'react-dom/server';
console.log(renderToString(<div style={{ background: 'url(/playbutton.png) no-repeat center/100% 100%' }} />));
