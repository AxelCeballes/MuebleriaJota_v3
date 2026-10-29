# React + Vite

Esta plantilla ofrece una configuración mínima para trabajar con React en Vite con HMR y algunas reglas de Oxlint.

Actualmente hay dos plugins oficiales disponibles:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) usa [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) usa [SWC](https://swc.rs/)

## React Compiler

El React Compiler no está habilitado en esta plantilla por su impacto en el rendimiento de desarrollo y de compilación. Para agregarlo, consultá [esta documentación](https://react.dev/learn/react-compiler/installation).

## Ampliar la configuración de Oxlint

Si estás desarrollando una aplicación para producción, te recomendamos usar TypeScript con las reglas de linting con conocimiento de tipos habilitadas. Revisá la [plantilla de TS](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) para ver cómo integrar TypeScript y las reglas de Oxlint relacionadas con TypeScript en tu proyecto.
