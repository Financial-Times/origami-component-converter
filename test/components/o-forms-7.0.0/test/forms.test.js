/* eslint-env mocha, sinon, proclaim */

import proclaim from 'proclaim';
import sinon from 'sinon/pkg/sinon';
import formFixture from './helpers/fixtures';
import Forms from './../main';

describe('Forms', () => {
	let formEl;
	let parentClass;
	let requiredTextField;
	let dateFields;

	before(() => {
		parentClass = (element, modifier) => element.closest('.o-forms-input').classList.contains(`o-forms-input--${modifier}`);
	});

	context('on `submit`', () => {
		let submit;
		let summary;
		let formSpy;

		beforeEach(() => {
			document.body.innerHTML = formFixture;
			formEl = document.forms[0];
			formSpy = sinon.spy(formEl, 'addEventListener');

			dateFields = formEl.elements['date'];
			requiredTextField = formEl.elements['required'];
			submit = formEl.elements[formEl.elements.length - 1];
		});

		afterEach(() => {
			document.body.innerHTML = null;
		});

		it('`opts.useBrowserValidation = true` relays form validation to browser on all invalid form inputs', () => {
			new Forms(formEl, { useBrowserValidation: true });
			submit.click();

			proclaim.isTrue(formSpy.withArgs('submit').notCalled);
			proclaim.isTrue(parentClass(dateFields[0], 'invalid'));
			proclaim.isTrue(parentClass(requiredTextField, 'invalid'));
		});

		it('`opts.useBrowserValidation = false` manually validates form inputs', () => {
			new Forms(formEl);
			submit.click();

			proclaim.isTrue(formSpy.withArgs('submit').calledOnce);
			proclaim.isTrue(parentClass(dateFields[0], 'invalid'));
			proclaim.isTrue(parentClass(requiredTextField, 'invalid'));
		});

		context('`opts.errorSummary = true`', () => {
			let listItems;
			let textInput;

			beforeEach(() => {
				new Forms(formEl);
			});

			it('creates new summary when inputs are invalid', () => {
				submit.click();
				summary = formEl.querySelector('.o-forms__error-summary');
				proclaim.isNotNull(summary);
			});

			it('the summary reflects the number of invalid inputs', () => {
				submit.click();
				summary = formEl.querySelector('.o-forms__error-summary');
				listItems = summary.querySelectorAll('a');
				proclaim.equal(listItems.length, 4);
			});

			it('the summary gets updated on second submit if a form field has been amended', () => {
				submit.click();
				summary = formEl.querySelector('.o-forms__error-summary');
				listItems = summary.querySelectorAll('a');
				proclaim.equal(listItems.length, 4);

				textInput = formEl.elements['text'];
				textInput.value = 'something';

				submit.click();
				summary = formEl.querySelector('.o-forms__error-summary');
				listItems = summary.querySelectorAll('a');
				proclaim.equal(listItems.length, 3);
			});
		});

		context('`opts.errorSummary = false`', () => {
			it('does not create a new summary when inputs are invalid ', () => {
				new Forms(formEl, { errorSummary: false });
				submit.click();
				summary = formEl.querySelector('.o-forms__error-summary');
				proclaim.isNull(summary);
			});
		});
	});

	context('.setState()', () => {
		let form;
		let name;
		let radioInputs;

		before(() => {
			document.body.innerHTML = formFixture;
			formEl = document.forms[0];
			name = 'radioBox';
			radioInputs = formEl.elements[name];

			form = new Forms(formEl);
		});

		after(() => {
			document.body.innerHTML = null;
		});

		it('`saving` to named input', () => {
			form.setState('saving', name);
			proclaim.isTrue(parentClass(radioInputs[0], 'saving'));
		});

		it('`saved` to named input', () => {
			form.setState('saved', name);
			proclaim.isFalse(parentClass(radioInputs[0], 'saving'));
			proclaim.isTrue(parentClass(radioInputs[0], 'saved'));
		});

		it('`none` to named input', () => {
			form.setState('none', name);
			proclaim.isFalse(parentClass(radioInputs[0], 'saving'));
			proclaim.isFalse(parentClass(radioInputs[0], 'saved'));
		});
	});

	context('.destroy()', () => {
		let form;
		let formSpy;
		beforeEach(() => {
			document.body.innerHTML = formFixture;
			formEl = document.forms[0];
			form = new Forms(formEl);
		});

		afterEach(() => {
			document.body.innerHTML = null;
		});

		it('removes all references to Forms, Inputs and State', () => {
			proclaim.isInstanceOf(form, Forms);

			form.destroy();
			proclaim.isNull(form.form);
			proclaim.isNull(form.opts);
			proclaim.isNull(form.formInputs);
			proclaim.isNull(form.stateElements);
		});

		it('removes all event listeners', () => {
			formSpy = sinon.spy(formEl, 'removeEventListener');

			form.destroy();

			proclaim.isTrue(formSpy.calledOnce);
		});
	});
});
