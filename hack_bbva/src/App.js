import React, { Component } from 'react';
import './css/bootstrap.css';
import './css/style.css';
import './css/watson.css';
import FacebookProvider, { Login } from 'react-facebook';
import TwitterLogin from 'react-twitter-auth/lib/react-twitter-auth-component.js';
import InstagramLogin from 'react-instagram-login';

import Facebook from "./facebook";
import Twitter from "./twitter";
import Instagram from "./instagram";
import Linkedin from "./linkedin";
import axios from 'axios';
import emoji from 'emoji-strip';


class App extends Component {

    constructor(props){
        super(props);
        this.handleTwitterResponse = this.handleTwitterResponse.bind(this);
        this.handleFacebookResponse = this.handleFacebookResponse.bind(this);
        this.handleInstagramResponse = this.handleInstagramResponse.bind(this);
        this.handleError = this.handleError.bind(this);
        this.replaceText = this.replaceText.bind(this);
        this.clean = this.clean.bind(this);
        this.removeDuplicates = this.removeDuplicates.bind(this);
        this.responseLinkedin = this.responseLinkedin.bind(this);
    }

    handleFacebookResponse = (data) => {

        const me = axios({
            method: 'get',
            responseType: 'json',
            url: `https://graph.facebook.com/${data.profile.id}/photos?fields=images,name&access_token=${data.tokenDetail.accessToken}`,
            config: {
                headers: {
                    'Accept': 'application/json'
                }
            }
        });

        me.then(json => {

            localStorage.setItem("facebookToken",data.tokenDetail.accessToken);
            localStorage.setItem("facebookUser",JSON.stringify(data.profile));

            const filter={};
            filter.mentions = true;
            filter.links = true;
            filter.emojis = true;

            const val = json.data.data.map((e) => {
                return {
                    id: e.id,
                    link: e.images[0].source,
                    text: e.name != null ? this.replaceText(e.name,filter):null,
                    location: e.place != null ? e.place.location:null
                };
            });

            const serverport = {
                data: JSON.stringify(val),
                source: "Facebook",
                user: JSON.stringify(data.profile)
            };

            axios.post('http://localhost:4200/visual', serverport)
                .then(res => console.log(res.data))
                .catch((e) => {
                    console.log(e)
                })
        }).catch((e) => {
            console.log(e)
        })
    };

    handleInstagramResponse = (data) => {

        const me = axios({
            method: 'get',
            responseType: 'json',
            url: `https://api.instagram.com/v1/users/self/?access_token=${data}`,
            config: {
                headers: {
                    'Accept': 'application/json'
                }
            }
        });

        me.then(json => {
            const perfil = json.data.data;
            localStorage.setItem("instagramToken",data);
            localStorage.setItem("instagramUser",JSON.stringify(perfil));
            localStorage.setItem("process","true");
            this.props.history.push("/");
        });

    };

    getInstragramResponses = () => {
        localStorage.removeItem("process");

        const data = axios({
            method: 'get',
            responseType: 'json',
            url: `https://api.instagram.com/v1/users/self/media/recent/?access_token=${localStorage.getItem("instagramToken")}`,
            config: {
                headers: {
                    'Accept': 'application/json'
                }
            }
        });

        data.then(json => {
            try {

                const filter={};
                filter.mentions = true;
                filter.links = true;
                filter.emojis = true;

                const photos = json.data.data;
                const resultados = photos.map((e) => {
                    return ({
                        id: e.id,
                        link: e.images.standard_resolution.url,
                        text: e.caption !== null ? this.replaceText(e.caption.text,filter):null,
                        location: e.location !== null ? e.location:null
                    });
                });

                const serverport = {
                    data: JSON.stringify(resultados),
                    source: "Instagram",
                    user: localStorage.getItem("instagramUser")
                };

                axios.post('http://localhost:4200/visual', serverport)
                    .then(res => console.log(res.data))
                    .catch((e) => {
                        console.log(e)
                    })

            }catch (e) {
                console.log(e)
            }
        });
    };

    handleTwitterResponse = (data) => {
        const token = data.headers.get('x-auth-token');
        data.json().then(user => {
            localStorage.setItem("twitterToken",token);
            localStorage.setItem("twitterUser",JSON.stringify(user));

            const tweets = axios({
                method: 'get',
                responseType: 'json',
                url: `http://localhost:4000/tweets?token=${token}`,
                config: {
                    headers: {
                        'Accept': 'application/json'
                    }
                }
            });

            let limpio, mentions;

            tweets.then(json => {
                const datos = json.data;

                let filter = {
                    "mentions": true,
                    "links": true,
                    "emojis": true
                };
                limpio = this.clean(datos, JSON.stringify(filter));

                filter = {
                    "mentions": false,
                    "links": true,
                    "emojis": true
                };

                mentions = this.clean(datos, JSON.stringify(filter));
                const serverport = {
                    data: JSON.stringify(limpio),
                    source: "Twitter",
                    user: JSON.stringify(user)
                };

                axios.post('http://localhost:4200/personality', serverport)
                    .then(res => console.log(res.data))
                    .catch((e) => {
                        console.log(e)
                    })
            }).catch((e) => {
                console.log(e);
            })


        })
    };

    replaceText = (tweet, filter) => {
        if (filter.mentions) {
            tweet = tweet.replace(/(@)[\n\S]+/g, '')
        }
        if (filter.emojis) {
            tweet = emoji(tweet);
            tweet = tweet.replace(/(^|\s)(:D|:\/|:\)+|;\)|:-\))(?=\s|[^[:alnum:]+-]|$)/g,'')
        }
        if (filter.links) {
            tweet = tweet.replace(/(?:https?):\/\/[\n\S]+/g, '')
        }

        tweet = tweet.replace('\r', '')
            .replace(/RT\s+/g, '')
            .replace('&amp;', '')
            .replace('&lt;', '')
            .replace('&gt;', '')
            .replace(/&gt;+/g,'')
            .replace(/#/g, '')
            .replace(/\s+/g, ' ').trim()
            .replace(/([a-z](?=[A-Z]))/g, '$1 ');

        return tweet;
    };

    clean = (array, options) => {

        let filter = {};
        if (!options) {
            filter.mentions = true;
            filter.links = true;
            filter.emojis = true;
        } else {
            filter = JSON.parse(options)
        }

        let result = array.map((tweet) =>{
            return this.replaceText(tweet,filter);
        });

        return this.removeDuplicates(result);
    };

    removeDuplicates = (tweets) => {
        let hash = new Map();
        for (let i = 0; i < tweets.length; i++) {
            let temp = hash.get(tweets[i]);
            if (!temp) {
                hash.set(tweets[i], tweets[i])
            } else {
                tweets.splice(i, 1);
                i = i -1;
            }
        }
        return tweets;
    };

    handleError = (error) => {
        this.setState({ error });
    };

    responseLinkedin(response) {
        console.log(response)
    }

    render() {

        if(localStorage.getItem("process")){
            this.getInstragramResponses();
        }


        return (
            <div className="App">
                <div className="container">
                    <nav className="navbar navbar-light bg-light-watson">
                        <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAawAAAB2CAMAAACjxFdjAAAAwFBMVEX///8AAAAAj//y8vK/v7/Y2Nj5+fksLCzKysrb29uvr6/29vYJCQmsrKwAjf98fHxMTExEREQAiv8hISHk5ORIo/+YmJjs7OySkpLExMQ8PDxnZ2eJiYkAiP9dXV1hYWEYGBi5ubnS6/9vb2+goKAyMjITExNCQkJ/f39UVFTQ0NBsbGwmJiYdHR0wMDCJw//l8/8vnP90uP8Xlf+m0//O5v9fsv+dzP/x+v+83//P6f+02P9HqP/b7/+Mw/8/n/8ny6NfAAANPklEQVR4nO1daWPauhKFGEwcIGwOZnEAXyAJTtIlaZveJm3//796GLzojBYL0oK5T+dbMGNJc2ZGI2lESiUDAwMDAwODQuPl57F7YKCN3923V/vYnTDQw9Xl5fXzr0/H7oaBDq4uz87Outdvr8fuiEE+NmSdnV1en300s1fREZMVudfl27/fj90dAxUystbu1f1s3KvIYMmK3Ovsm3GvwoKQFc1evz+a5LCY4MiKouHavY7dLwMBBGRt3Ovzi4mGhcNvIVmRe11/+3rszhkgnrpdCV1r93p+MbNXofD95eq6K6ErSg6NexULP56e5e51+fmLca9C4dOXt0uZe112n5+MexULPz7K3avbvfpy7P4ZAL6/vp3J3evHsbtnQPBT7l7/HLtvBjz+/XYt5MuQVUh8f/l8zdNlyCoqfjwZsk4FP1+uDFkngU9RUmjC4AnA/vr0LJiwDFnFw6dfv6X7hIasQuH1TZy0R+iaRXGB8PWpKw5/Z9H2RdfsDhYG//x67sqPSa6vvphT44Lg0+uVdEswqsd4MgGwKPj6Tb7ZHu22m7PiAuG3wqmev3018a9IEFc3bU6IjVMVDWKyTOVgISEq8jRVTQUFR1b32jhVUYFkmUrcQoMh67J7aZyq0EjJWjuVuT1ScMRkdc/MtcfiIyJrvfw1Nx5PAVfrmert1TjVSeDz5UdzrHgqMOmfgYGBgRj2cHjsLhjowVvclpvH7oSBDpzWrFw2ZJ0Cgkl5A0NW0WEtbsplQ9YpILwvZzBkFRvLsiHrZDAyZJ0ODFknBEPWCcGQdUIwZJ0QTp0sJwxDx9tJxI1kdhGx3GoYVnf5xwWeE1bdvf7TQdSStG+HJMtzHPmjnUfnDQftXtLzm1ErcHNF7PNFe5ZJDC2NRvxlI5Z4bPfD/G5VL8a9WGLW8SuSTjlVBkk3qv1kIdWbn+P33eh7LqyzBsk7Em7r7DurdXyB5KFdYZG8yQrGj+XySDi6aTa6wTBf5dtGVrMyQWN1rqTbmdeIxONEfc4wnDwSiVpLam8RvP6SCDTaQV3wRejJxeajcAWCS/CcMR0sAz/+zjl8StjGh5XkYws+3mrD8req7eSP7qbdzA9RwagsxG0gFXHvhRIrubNU2kKJO2n3rEFPJDBq8jbEkWXdcXJtpqHDkLWRCZK+EbI8n3OPCL2ByBgZMUXXxxLPHEgl7sTuaE1kAg8X4iYq1HFTdDh3pGQ5twKxWSZ2OLIyo0GyLh5k7X9Qhaeq0H4T9KoCEU+q+TWWIlcJhWYUYy7qlq/qFfV4Qla1IZTqpT17N1lDeCgna579xZJl847PYCHlyrlRya3Bzyqu1Co2mPHeGKibmPDdmqolyHiQLFtmfuNDk8VaHEOWrTL2NQYSrrw8rsplGte8PIEeTQsv8iSmtFvi+Y0BsgVkVeREJyo/DFmhw/7FkCUK0oC+mKxcOS5KWfkSK5QI8iWIp4izF0CF/T6QtZKJrJOMw5IFyW9GVo5fRRDO4818ORoIFbpIAbp38523XIbQmeuJa8zYqVGai1BU/xBZFXgoJqvRgi+lZC00+tkQJXZk9mn7fb/FRRFwLZ2mUJO5IS3CmBFwybPJhWVZXgXHXr7fh6zBIclCI03IIqN7HITR6AIyunGJA7Y5C7bTk0dzFSb15yasth9UwyYdPRN0OTcZ94fO+YBSyLjvHB7M0tTPxZjN5Kk8WQ/3g4E/54J8rLHBZDqdYoi4nW4xSVbP7yZL3DRJnebp/O7gEplfsIKObzJ9YV/YTJkYQCcZhNOBz3upgE2S9lbi4AEa3l0qEcLnDwwnNjDMODxHVrzUrp8Tm3hgch8Mz9ws8afJut1+BWe7O+adNpgW71ogyC5e+vDETz8nPjzNMkVsqpyu7IhjMS4XwmooUyN6KWjJBZFM8ZSsLPuoE7YYg3XgZdxGrpKsQNycnKxGI05uILvATAySxzJNqUH1sML2euJ34s5FmxXBjqYmg2sen5VA80zUiPbQwh5D+5kzELLYEELMi9keOBhZreC86npb5SMhZMcBwhZ1ddAW5vZg3rNk0iLugykLpB5JHMTOLbF9mDUSHtEeyHYIhK7MhpAsXFOiozIZ/2HIusPJB9IBurwEZdGdguqgn2KAmsfdnvTUAT4lVo/r6/hDjKcVlIAhJ0Ea4pZ6tZx+imShBK5OmFh/CLJuSQpuw9TOtQlP6UM5MENPyEKrpxtRoMjYw2E/nx7p1NmHna37oity22QQKdIOAFlkasZ8hdHPAcha0d0f9bSEebDe6VaEpvCtELdqnEynnSJJE+E1PpWYZwLt6bYRzJa4bWToV+omQBYhGCetg5JV404gIN3iFIhxSH4+pXxrQlYdlgKc6ks2g+0naNbnGhK4xqvbCJxmU1oEh48pUIEHJYtXN7jO2KajA1OUb76vmfCcoO/fxcAVo6U1PAGg9YbyWDgGNtymgAwnNRcVWRBr/xRZaMsysvjRwUxR40YHk4Zs771U7c8lp8UbxGTl+QkPmOSW+UUaZJLLQZrhFJOsFn3lbqPjI9emiQUtBqCItYzzic4ECEGtnf/9kqU+K0Ok24PFJIuPgq7yoJdAwHXJa+XLxWQF8KFO9RQscgRnjPxwaE2NCmliX0yyKvSV+Se9LATH+4GOXEwWpogaqsfNFW7RJIDWeUqClP1iksXPE7hOzQEfuZSlDilisnCFq6F6W73CFcARl0+IcXJk4aSfA44sPa4OSNZOtvf/RVagKReThdsaGqrfPQz+tz3rPWGwzn+jEQM/tURd1FD9HgkGzFkNJYqeYPBk7WSKZFVKSjUfWpXQ2SLEZF6YuutcRoBMc5X//ZIH2eDEUSK1vZMhC0wxGKpQIaW5yBU7yDqu3ixR/0XlnxRgDrfqyuAN7A+shM7KLMKpkOXBKlJ/p7ZEjrOgxkVCFoZcnY1GmOUedXoH+0kNzZEcnCxcxGiThaPj12EKgNmj6sVkWaAUvhJx0eglmK0EI+Z9cTVLJeIYjfUkmteWToYs2PlU7dRyYPWCjiUhC/ch+SmI7cr2VMmG1/C9Y59uycKMU/O3yv4+WcQLfPHDXLJATljjL4HNEtLB+cSDqSMlS3x+nMBlC5liYiBR4ehlM5aHrbngUoTbzLSdappfZHca/z5Z5DHmX/pkwUv5IG9XmdGBem12tiN6JLs+iRxqkjoKOEU8APXZMnu8E/cA5+AezUngqDWl5Q+QxXk9jhXPK0j1pD5ZqFfuC+fCt0aAij7iWQH2JiHLAov6QLwRKgSFQyaODwlL4kQ4aVGDh02UdA7cjyxQHFenh9kUViRgGeoOZOXsEsCyVO5ZJI8k1XapHMZBDFLQUuqp6KLQf5wYE80HINDDuRRL5NKP9yLLxfJTLqjj/j9bpIRd3Imsheob4Fh46G/LzyXplmE6EFKFx8YOtLa0/+TqAxMIceNwlLgpppyk5gSyqezAZy+y6tgQt6bDHOtDRiZ3m2MHsrAE7AEsBJVLkm28WJON0SZezlodOfyaJA7p4j0WpnyavCo1ihB1lfWN7KssM5t2UX+ZMvYiizu2HVSGwWI1SqyDXJepVYQjjbADWcQPeozDkpp1skGEm+jl+TYQOYJ7IhlZ3MWEVb8yHAZ0AIxO6MWExrg5HA6b9HA6m//q9Pzxtln1PM8dktsPTMXofmSJ75J0ErL461Crlu+LLrTtQhatVptsf5HCDciL74kct2H/sLxdCg+eGW/VuvIzYmOXzoUuCKiC61mz2YzbA2V0sR9Z4mtgKVmO8LEIu5DF28DjqDOqcWeu3G6P9hE6G1p1rltBybDOVvMt9Evj4iOWKOxHlivsWEqW6l7zDYjuRNbuxishWQaWLCv/4J20VMkVIAG6rlFXAmuN/ciiGXj84pQsxVGhpCpciywNBYru0ikqo2qwhYFJS15jd7SZXKOgu0r07iOPJYSJPckSBrqMLDGZmxHiImw3sjSOINui8wmpUhp4Cw3XIDk/rSAoTgyUAjeCI1XV72as8QFD+p5kCSdghiyyisi+QpxuR7JKYY65t8UFlkPJ10O83EOELdWvVAhPTlTKr4lOTixlZO+QvHZfskix9vbdTHIkNuaRtcPPAQnhKSf+qeysQajFkVuqq8haT0OyWWUlOz+W/oCQrEpYcWWf23Tdmyy6fCkjWUK2oszmnWQpZwbFSUOdL3CK8gPcChK4ZbPDya39V9GQ54uSz7m8OMCW8OvzvQHTIXyoySo5dIkIy45SnZbA9jbMvJsskd4jNCS/V5K2sGCd8mGw0UV99VBLcSOMoc6AXCLwcw7668M7MIGbaV9dx1Hvc8Fw1RT1xW8xIDqy58wz+sODm3H4TCs3E0qn6zN+245/ks1hG2yl47abLHKKVCx+dJOL/MoH26su/Pl4PJ4PwnSDnYVU7nwtdz++b/nNqqdzqlv3gn5rLTFv9QNXp+LGGw7m0/aoVhu1V2O/stuPjOrC9twwWPT7zdATNWAl2lk4e/2cqKLdynp0nc3oJmN/+HdGd2DYludZf1ZPBUL9Pz06AwMDg/fif0Yf+RupHuceAAAAAElFTkSuQmCC"
                             className="d-inline-block align-top" alt="" width="25%"/></nav>
                    <div className="row">
                        <div className="col">
                            <div className="wellcome">
                                <h3>Bienvenido a I.D.E.P - Información Detallada y Estudio de Personalidad</h3>
                                <p className="base--p jumbotron--description description">
                                    Por favor autentica en tus redes sociales para empezar a analizar tu perfil
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="row">
                            <div style={{display:"inline-block", textAlign: "-moz-center"}} className="offset-lg-1 col-lg-5">
                                <FacebookProvider appId="333323414082290">
                                    <Login
                                        scope="email, user_photos, user_posts, user_likes"
                                        onResponse={this.handleFacebookResponse}
                                        onError={this.handleError}
                                        render={({ isLoading, isWorking, onClick }) => (
                                            <span onClick={onClick}>
                                            <Facebook/>
                                        </span>
                                        )}
                                    />
                                </FacebookProvider>
                            </div>
                            <div style={{display:"inline-block", textAlign: "-moz-center"}} className="col-lg-5">
                                <TwitterLogin style={{border:0}} loginUrl="http://localhost:4000/oauth_request"
                                              onFailure={this.handleError} onSuccess={this.handleTwitterResponse}
                                              requestTokenUrl="http://localhost:4000/oauth_request/callback">
                                    <Twitter/>
                                </TwitterLogin>
                            </div>
                        </div>
                        <div className="row">
                            <div style={{display:"inline-block", textAlign: "-moz-center"}} className="offset-lg-1 col-lg-5">
                                <InstagramLogin
                                    clientId="c86fc2a2eeca4001adb1702d9b5bb383"
                                    onSuccess={this.handleInstagramResponse}
                                    onFailure={this.handleError}
                                    buttonText=""
                                    tag="div"
                                    type="div"
                                    cssClass="instaButton"
                                    implicitAuth={true}
                                >

                                    <Instagram/>
                                </InstagramLogin>
                            </div>
                            <div style={{display:"inline-block", textAlign: "-moz-center"}} className="col-lg-5">
                                <FacebookProvider appId="333323414082290">
                                    <Login
                                        scope="email"
                                        onResponse={this.handleResponse}
                                        onError={this.handleError}
                                        render={({ isLoading, isWorking, onClick }) => (
                                            <span onClick={onClick}>
                                            <Linkedin/>
                                        </span>
                                        )}
                                    />
                                </FacebookProvider>
                            </div>
                        </div>
                    </div>
                    <div id="root" className="row">
                        <div className="dropzone _container _container_large" style={{position: "relative"}}
                             aria-disabled="false">
                            <div className="flex buttons">
                                <div id="fb-root"/>
                            </div>
                            <div className="tab-panels" role="tabpanel">
                                <ul className="tab-panels--tab-list" role="tablist">
                                    <li className="tab-panels--tab-list-item base--li" role="presentation"><a
                                        href="#transcripción-de-llamada-" className="active tab-panels--tab base--a"
                                        role="tab">Datos Recopilados </a></li>
                                </ul>
                                <div className="tab-panels--tab-content">
                                    <div data-id="Transcripción de llamada ">
                                        <div/>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="row">
                                    <div className="col flex buttons">
                                        <button type="button" className="base--button">Salir</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}



export default App;

