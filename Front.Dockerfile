FROM node:22-alpine as lib

WORKDIR /app

# Install dependencies
COPY Lib/Client/package.json .
RUN npm install

# Build
COPY Lib/Client .
RUN npm run build --ignore-scripts

FROM node:22-alpine
ARG ECHO_LIB_PATH=/app/echo

WORKDIR /app

# Install dependencies
COPY Preview/Client/package.json .
RUN npm install

# Move project and libs
COPY --from=lib /app/dist ${ECHO_LIB_PATH}
COPY Preview/Client .

ENV ECHO_LIB_PATH=${ECHO_LIB_PATH}

CMD ["npm", "run", "start"]