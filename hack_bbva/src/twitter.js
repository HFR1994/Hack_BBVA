import React, { Component } from 'react';
import "./css/twitter.css"
import twitter from "../src/images/twitter.svg"

class Twitter extends Component{

    render (){

        return(
            <div id="twitter">
                <div style={{height: "50px", width: "277px", borderRadius: "3%"}} className="abcRioButton abcRioButtonBlue">
                    <div className="abcRioButtonContentWrapper">
                        <div className="abcRioButtonIcon">
                            <div>
                                <img alt="google-logo" style={{width: "47px"}} className="image_logo" src={twitter}/>
                            </div>
                        </div>
                        <span className="abcRioButtonContents">
                        <span>Iniciar Sessión con Twitter</span>
                    </span>
                    </div>
                </div>
            </div>
        )
    }
}

export default Twitter;