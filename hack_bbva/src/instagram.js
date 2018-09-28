import React, { Component } from 'react';
import "./css/instagram.css"
import instagram from "../src/images/instagram.svg"


class Instagram extends Component{

    render (){

        return(
            <div id="instagram">
                <div style={{height: "50px", width: "277px", borderRadius: "3%"}} className="abcRioButton abcRioButtonBlue">
                    <div className="abcRioButtonContentWrapper">
                        <div className="abcRioButtonIcon">
                            <div>
                                <img alt="google-logo" style={{width: "47px"}} className="image_logo" src={instagram}/>
                            </div>
                        </div>
                        <span className="abcRioButtonContents">
                        <span>Iniciar Sessión con Instagram</span>
                    </span>
                    </div>
                </div>
            </div>
        )
    }
}

export default Instagram;