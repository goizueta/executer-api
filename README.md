# executer-api
A RESTful API built for consumption by the Executer client apps, which originated as the winning project in [Uber's first international hackathon](https://medium.com/uber-developers/uber-s-first-hackathon-in-lagos-nigeria-d5cb392e7aeb#.cse7erpzb).


Executer automatically schedules a ride via Uber for events in your Google Calendar. 


![Executer Screenshots](http://i.imgur.com/Y1FyjmK.png)
Screenshots of app using UberHack API.

```
Uber API <-                        -> Executer for iOS
            \                    /
              -> UberHack App <-
            /                    \
GCal API <-                        -> Executer for Android
                                  
```

Check out the repos of mobile apps that already use the UberHack backend:
- [Executer for iOS](https://github.com/andela-Kshittu/Executer)
- [Exectuter for Android](https://github.com/andela-aabdullahi/Executer)

[Hosted Dev Version of API](https://andelahack.herokuapp.com/)

## Getting Started

Get the app running locally in the following way:
```
# Clone the Repo
git clone https://github.com/andela-ladenusi/uberhack
cd uberhack

# Install dependencies
npm install

# Run the app
gulp default
```
The server will now be running at `http://localhost:5555`

## Endpoints

- **<code>GET</code> calendar**
  - Returns calendar events after Google OAuth
- **<code>GET</code> location**
  - Returns location in Address form when supplied `lng` and `lat`, and vice versa
- **<code>GET</code> login**
  - Redirects to Uber Login
- **<code>POST</code> login**
  - Creates login session
- **<code>GET</code> requests/shared**
  - ???
- **<code>GET</code> trips/:uuid**
  - Returns information about a particular trip
- **<code>POST</code> trips/:uuid**
  - Creates a new trip
- **<code>GET</code> uber/callback**
  - ???
- **<code>GET</code> user**
  - Returns user data and access token when sent Uber Login Credentials
- **<code>GET</code> users/:id/requests**
  - Returns requests for a particular user
- **<code>GET</code> users/:uuid/requests/:id**
  - Returns particular request for a particular user
- **<code>DELETE</code> users/:uuid/requests/:id**
  - Deletes an existing request

## License
Code released under [the MIT license](https://github.com/andela/executer-api).

