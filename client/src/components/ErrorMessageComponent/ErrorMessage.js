// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { DefaultButton, Spinner } from "office-ui-fabric-react";
import ModalComponent from "../ModalComponent/ModalComponent";
import { eventService } from "../../services/EventService";
import { CUSTOM_AUTH_ERROR_MESSAGE, AUTH_SUCCESS_MESSAGE, AUTH_CONFLICT_MESSAGE, AUTH_FORBIDDEN_MESSAGE } from "../../services/Constants";
import { print } from "../../services/LoggingService";
import { apiService } from "../../services/ApiService";

import "./ErrorMessage.scss";

export class ErrorMessageComponent extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      errorMessage: "",
      showFixAuth: false
    };
  }

  componentDidMount() {
    eventService.subscribeError(exc => {
      let message = "";
      let auth = "";
      // Service does not return an error code - only a name
      if (exc && exc.name === "RestError" && !exc.code) {
        message = CUSTOM_AUTH_ERROR_MESSAGE;
        auth = true;
      } else {
        message = exc.customMessage ? `${exc.customMessage}: ${exc}` : `${exc}`;
      }

      print(message, "error");

      this.setState({
        errorMessage: message,
        showModal: true,
        showFixAuth: auth
      });
    });
  }

  close = () => {
    this.setState({ showModal: false });
  }

  fixPermissions = () => {
    this.setState({showFixAuth: <Spinner />});
    const requestParams = await apiService.addReaderRBAC();
    for (const i in requestParams) {
      if (requestParams[i]) {
        switch (requestParams[i].status) {
          case 201:
            this.setState({showFixAuth: <p style={{color: "green", "textAlign": "left", width: 400, margin: 0}}>{AUTH_SUCCESS_MESSAGE}</p>});
            break;
          case 403:
            this.setState({showFixAuth: <p style={{margin: 7}}>{AUTH_FORBIDDEN_MESSAGE}</p>});
            break;
          case 409:
            this.setState({showFixAuth: <p style={{margin: 7}}>{AUTH_CONFLICT_MESSAGE}</p>});
            break;
          default:
            this.setState({showFixAuth: <p>{requestParams[i].statusText}</p>});
        }
      }
    }
  }

  render() {
    const { showModal, errorMessage, showFixAuth } = this.state;
    let authButton = "";
    if (showFixAuth) {
      authButton = <DefaultButton className="modal-button close-button" onClick={this.fixPermissions} style={{width: 150}}>Assign yourself data reader access</DefaultButton>;
    }
    return (
      <ModalComponent
        isVisible={showModal}
        className="error-message">
        <div className="message-container">
          <h2 className="heading-2">Error</h2>
          <p>{errorMessage}</p>
          <div className="btn-group">
            <DefaultButton className="modal-button close-button" onClick={this.close}>Close</DefaultButton>
            {authButton}
          </div>
        </div>
      </ModalComponent>
    );
  }

}
