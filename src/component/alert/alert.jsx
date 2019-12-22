    import React, { PureComponent } from 'react';
import AlertManager from '../../manager/alertManager';
import Overlay from '../overlay/overlay';
import AlertObject from './alertobject';

export default class Alert extends PureComponent {
    constructor() {
        super();
        this.state = {
            alerts: []
        }
    }
    componentDidMount() {
        AlertManager.registerHandler(this.updateAlerts);
    }

    updateAlerts = () => {
        this.setState({
            alerts: AlertManager.alerts
        }, () => {
            this.forceUpdate();
        })
    }

    dismiss = (id) => {
        AlertManager.dismissAlert(id);
    }

    render() {
        if(this.state.alerts.length) {
            return (
                <Overlay>
                    {
                        this.state.alerts.map(alert => 
                            <AlertObject
                                key={alert.id}
                                dismiss={this.dismiss}
                                id={alert.id}
                                buttons={alert.buttons}
                            >
                                {alert.html}
                            </AlertObject>)
                    }
                </Overlay>
            )
        }

        return (
            <>
            </>
        )
    }
}