import React, { useEffect } from 'react';

const MetamaskLogo = () => {
    useEffect(() => {
        const script1 = document.createElement('script');
        script1.src = 'js/logoscript.js';
        script1.async = true;
        document.body.appendChild(script1);
        script1.onload = () => {
            const logoContainer = document.getElementById('logo-container');
            if(logoContainer.children.length == 2) {
                logoContainer.removeChild(logoContainer.lastElementChild);
            }
        };

        const script2 = document.createElement('script');
        script2.src = 'js/inputstate.js';
        script2.async = true;

        document.body.appendChild(script2);

        script2.onload = () => {
            const logoContainer = document.getElementById('logo-container');
            if (window.SomeLibrary) {
                if (logoContainer && logoContainer.children.length === 0) {
                    window.SomeLibrary.someFunction();
                }
            }
        };

        return () => {
            document.body.removeChild(script1);
            document.body.removeChild(script2);
        };
    }
    , []);

    return (
        <div id="logo-container"></div>
    );
}

export default MetamaskLogo;