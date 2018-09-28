import React, { Component } from 'react';
import "./css/facebook.css"
import facebook from "../src/images/facebook.svg"


class Facebook extends Component{

    render (){

        return(
            <div style={{height: "50px", width: "277px", borderRadius: "3%"}} className="abcRioButton abcRioButtonBlue">
                <div className="abcRioButtonContentWrapper">
                    <div className="abcRioButtonIcon">
                        <div>
                            <img alt="google-logo" style={{width: "47px"}} className="image_logo" src={facebook}/>
                        </div>
                    </div>
                    <span className="abcRioButtonContents">
                        <span>Iniciar Sessión con Facebook</span>
                    </span>
                </div>
            </div>
        )
    }
}

export default Facebook;