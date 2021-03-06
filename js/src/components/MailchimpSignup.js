import { Component } from "@wordpress/element";
import PropTypes from "prop-types";
import { localize } from "yoast-components";
import { LoadingIndicator } from "@yoast/configuration-wizard";
import { sendRequest } from "@yoast/helpers";

/**
 * @summary Mailchimp signup component.
 */
class MailchimpSignup extends Component {
	/**
	 * @summary Constructs the Mailchimp signup component.
	 *
	 * @param {object} props The properties.
	 *
	 * @returns {void}
	 */
	constructor( props ) {
		// Change the URL to work with json-p.
		super( props );

		this.state = {
			successfulSignup: this.props.value,
			isLoading: false,
		};

		this.setEmailInputRef = this.setEmailInputRef.bind( this );
	}

	/**
	 * Sends the change event, because the component is updated.
	 *
	 * @param {Object} prevProps The previous props.
	 * @param {Object} prevState The previous state.
	 *
	 * @returns {void}
	 */
	componentDidUpdate( prevProps, prevState ) {
		const successfulSignup = this.state.successfulSignup !== prevState.successfulSignup;

		if ( successfulSignup ) {
			this.sendChangeEvent();
		}
	}

	/**
	 * Checks if current component has a subscription already.
	 *
	 * @returns {boolean} Returns true if the user is already signed-up.
	 */
	hasSubscription() {
		return this.props.value.hasSignup;
	}

	/**
	 * @summary Execute a Mailchimp signup request.
	 *
	 * @returns {void}
	 */
	signup() {
		const email = this._emailInput.value;
		const data = `EMAIL=${email}`;

		this.setState( {
			isLoading: true,
		} );

		const result = sendRequest(
			this.props.properties.mailchimpActionUrl,
			{
				data,
				headers: {},
				dataType: "jsonp",
				jsonp: "c",
				method: "POST",
			}
		);
		this.handleResultSignup( result );
	}

	/**
	 * @summary Handles the result from a MailChimp signup.
	 *
	 * @param {Promise} result The promise from the signup request.
	 *
	 * @returns {void} Returns nothing.
	 */
	handleResultSignup( result ) {
		result
			.then(
				( response ) => {
					// For privacy reasons, don't show it when an email address is already on the mailing list.
					if ( response.msg.indexOf( "is already subscribed" ) !== -1  ) {
						this.setState( {
							isLoading: false,
							successfulSignup: true,
							message: "Almost finished... We need to confirm your email address." +
							"To complete the subscription process, please click the link in the email we just sent you.",
						} );
						return;
					}
					if ( response.result === "error" ) {
						this.setState( {
							isLoading: false,
							successfulSignup: false,
							message: this.stripMessage( this.stripLinkFromMessage( response.msg ) ),
						} );
						return;
					}
					this.setState( {
						isLoading: false,
						successfulSignup: true,
						message: response.msg,
					} );
				} )
			.catch( ( response ) => {
				console.error( this.props.translate( "MailChimp signup failed:" ), response );
			} );
	}

	/**
	 * Strips an HTML link element from the message string.
	 *
	 * @param {string} message The message string.
	 *
	 * @returns {string} The message string without a link element.
	 */
	stripLinkFromMessage( message ) {
		return message.replace( /<a.*?<\/a>/, "" );
	}

	/**
	 * @summary Strips "0 - " from the message string when present.
	 *
	 * @param {string} string The string to strip.
	 *
	 * @returns {string} String with the text.
	 */
	stripMessage( string ) {
		if ( string.endsWith( "0 - ", 4 ) ) {
			return string.slice( 4 );
		}
		return string;
	}

	/**
	 * @summary Triggers the onChange function in the Step component
	 *          to store the Mailchimp signup status.
	 *
	 * @returns {void}
	 */
	sendChangeEvent() {
		const evt = {
			target: {
				name: "mailchimpSignup",
				value: {
					hasSignup: this.state.successfulSignup,
				},
			},
		};

		this.onChange( evt );
	}

	/**
	 * Gets the loading indicator.
	 *
	 * @returns {null|JSX.Element} The loading indicator.
	 */
	getLoadingIndicator() {
		if ( ! this.state.isLoading ) {
			return null;
		}

		return (
			<div className="yoast-wizard-overlay"><LoadingIndicator /></div>
		);
	}

	/**
	 * Set the email input reference.
	 *
	 * @param {Object} ref The email input element.
	 *
	 * @returns {void}
	 */
	setEmailInputRef( ref ) {
		this._emailInput = ref;
	}

	/**
	 * @summary Renders the Mailchimp component.
	 *
	 * @returns {wp.Element} Rendered Mailchimp Component.
	 */
	render() {
		if ( this.skipRendering() ) {
			return null;
		}

		this.onChange = this.props.onChange;

		const input = <input
			id="mailchimpEmail"
			className="yoast-field-group__inputfield"
			ref={ this.setEmailInputRef }
			type="email"
			name={ this.props.name }
			defaultValue={ this.props.properties.currentUserEmail }
			autoComplete="email"
		/>;
		const button = <button
			className="yoast-button yoast-button--primary"
			onClick={ this.signup.bind( this ) }
		>
			{ this.props.translate( "Sign up!" ) }
		</button>;
		const message = this.getSignupMessage();
		const loader = this.getLoadingIndicator();

		return (
			<div className="yoast-wizard--columns yoast-wizard-newsletter">
				<div>
					<h2 className="yoast-wizard-newsletter--header">{ this.props.properties.title }</h2>
					<p>{ this.props.properties.label }</p>
					{ this.props.properties.freeAccountNotice && <strong>{ this.props.properties.freeAccountNotice }</strong> }
					<div className="yoast-wizard--columns yoast-wizard--columns__even">
						<div className="yoast-wizard-text-input yoast-wizard__mailchimp">
							<div className="yoast-wizard__mailchimp-input">
								<label
									htmlFor="mailchimpEmail"
									className="yoast-wizard-text-input-label"
								>
									{ this.props.translate( "Email" ) }
								</label>
								{ input }
							</div>
							{ button }
						</div>
					</div>


					{ message }
					{ loader }

					{ this.props.properties.GDPRNotice && <div dangerouslySetInnerHTML={ { __html: this.props.properties.GDPRNotice } } /> }
				</div>
			</div>
		);
	}

	/**
	 * When the last step is success and the user has already given their email address.
	 *
	 * @returns {boolean} Returns if the user is already signed up and
	 *                    component should be rendered.
	 */
	skipRendering() {
		const stepState = this.props.stepState;
		const isCurrentStepSuccess = (
			stepState.currentStep === "success"
		);
		const hasMailchimpSignup = (
			stepState.fieldValues.newsletter.mailchimpSignup.hasSignup === true
		);

		return (
			isCurrentStepSuccess && hasMailchimpSignup
		);
	}

	/**
	 * Renders the message after sign-up.
	 *
	 * @returns {JSX.Element} A HTML paragraph element containing the Mailchimp response.
	 */
	getSignupMessage() {
		if ( this.state.successfulSignup ) {
			return <p className="yoast-wizard-mailchimp-message-success" aria-live="assertive">{ this.state.message }</p>;
		}

		return <p className="yoast-wizard-mailchimp-message-error" aria-live="assertive">{ this.state.message }</p>;
	}
}

MailchimpSignup.propTypes = {
	translate: PropTypes.func.isRequired,
	title: PropTypes.string,
	component: PropTypes.string,
	name: PropTypes.string.isRequired,
	properties: PropTypes.object,
	data: PropTypes.string,
	onChange: PropTypes.func,
	value: PropTypes.shape(
		{
			hasSignup: PropTypes.bool,
		}
	),
	stepState: PropTypes.object,
};

MailchimpSignup.defaultProps = {
	title: "Mailchimp signup",
	component: "",
	properties: {},
	data: "",
	value: {
		hasSignup: false,
	},
};

export default localize( MailchimpSignup );
