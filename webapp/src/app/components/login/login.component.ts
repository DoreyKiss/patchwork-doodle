import { Component } from '@angular/core';

/**
 * Shows a main page where the user is asked to log in.
 * User is redirected to the previous page on success.
 */
@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent {

    constructor() { }

}
