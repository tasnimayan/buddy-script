"use client";

import { useActionState } from "react";

import { registerAction } from "@/lib/auth/actions";
import type { AuthFormState } from "@/lib/auth/types";

const initialState: AuthFormState = {};

export const SignupForm = () => {
  const [state, formAction, pending] = useActionState(
    registerAction,
    initialState,
  );

  return (
    <form className="_social_registration_form" action={formAction}>
      <div className="row">
        <div className="col-xl-6 col-lg-6 col-md-6 col-sm-12">
          <div className="_social_registration_form_input _mar_b14">
            <label
              htmlFor="firstName"
              className="_social_registration_label _mar_b8"
            >
              First name
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              autoComplete="given-name"
              required
              maxLength={100}
              className="form-control _social_registration_input"
            />
            {state.errors?.firstName && (
              <p className="_social_registration_error" aria-live="polite">
                {state.errors.firstName[0]}
              </p>
            )}
          </div>
        </div>
        <div className="col-xl-6 col-lg-6 col-md-6 col-sm-12">
          <div className="_social_registration_form_input _mar_b14">
            <label
              htmlFor="lastName"
              className="_social_registration_label _mar_b8"
            >
              Last name
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              autoComplete="family-name"
              required
              maxLength={100}
              className="form-control _social_registration_input"
            />
            {state.errors?.lastName && (
              <p className="_social_registration_error" aria-live="polite">
                {state.errors.lastName[0]}
              </p>
            )}
          </div>
        </div>
        <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
          <div className="_social_registration_form_input _mar_b14">
            <label
              htmlFor="email"
              className="_social_registration_label _mar_b8"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="form-control _social_registration_input"
            />
            {state.errors?.email && (
              <p className="_social_registration_error" aria-live="polite">
                {state.errors.email[0]}
              </p>
            )}
          </div>
        </div>
        <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
          <div className="_social_registration_form_input _mar_b14">
            <label
              htmlFor="password"
              className="_social_registration_label _mar_b8"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              className="form-control _social_registration_input"
            />
            {state.errors?.password && (
              <p className="_social_registration_error" aria-live="polite">
                {state.errors.password[0]}
              </p>
            )}
          </div>
        </div>
        <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
          <div className="_social_registration_form_input _mar_b14">
            <label
              htmlFor="confirmPassword"
              className="_social_registration_label _mar_b8"
            >
              Repeat Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              className="form-control _social_registration_input"
            />
            {state.errors?.confirmPassword && (
              <p className="_social_registration_error" aria-live="polite">
                {state.errors.confirmPassword[0]}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-lg-12 col-xl-12 col-md-12 col-sm-12">
          <div className="form-check _social_registration_form_check">
            <input
              className="form-check-input _social_registration_form_check_input"
              type="checkbox"
              name="acceptTerms"
              id="acceptTerms"
              defaultChecked
            />
            <label
              className="form-check-label _social_registration_form_check_label"
              htmlFor="acceptTerms"
            >
              I agree to terms & conditions
            </label>
          </div>
          {state.errors?.acceptTerms && (
            <p className="_social_registration_error" aria-live="polite">
              {state.errors.acceptTerms[0]}
            </p>
          )}
        </div>
      </div>
      {state.message && (
        <div className="row">
          <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
            <p className="_social_registration_error" role="alert">
              {state.message}
            </p>
          </div>
        </div>
      )}
      <div className="row">
        <div className="col-lg-12 col-md-12 col-xl-12 col-sm-12">
          <div className="_social_registration_form_btn _mar_t40 _mar_b60">
            <button
              type="submit"
              className="_social_registration_form_btn_link _btn1"
              disabled={pending}
            >
              {pending ? "Signing up..." : "Sign up"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};
