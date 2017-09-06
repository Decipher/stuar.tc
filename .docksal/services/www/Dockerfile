# Use Node 6 as our base service.
FROM node:6

# Configure the services environemnt variables.
ENV HOST 0.0.0.0

# Copy WWW source into our service.
#COPY ./www /var/www

# Set the working directory to our copied source WWW.
VOLUME ["/var/www"]
WORKDIR /var/www

# Set the NPM start script as our entry command.
CMD '/var/www/.docksal/services/www/entrypoint.sh'
