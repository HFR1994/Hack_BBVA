import React, { Component } from 'react';
import "./css/linkedin.css"
import linkedin from "../src/images/linkedin.svg"

class Linkedin extends Component{

    render (){

        return(
            <div id="linkedin">
                <div style={{height: "50px", width: "277px", borderRadius: "3%"}} className="abcRioButton abcRioButtonBlue">
                    <div className="abcRioButtonContentWrapper">
                        <div className="abcRioButtonIcon">
                            <div>
                                <img alt="google-logo" style={{width: "47px"}} className="image_logo" src={linkedin}/>
                            </div>
                        </div>
                        <span className="abcRioButtonContents">
                        <span>Iniciar Sessión con LinkedIn</span>
                    </span>
                    </div>
                </div>
            </div>
        )
    }
}

export default Linkedin;