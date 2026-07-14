import Image from "next/image";
import Link from "next/link";

import { SignupForm } from "@/components/auth/signup-form";

export default function Register() {
  return (
    <section className="_social_registration_wrapper _layout_main_wrapper">
      <div className="_shape_one">
        <Image
          src="/images/shape1.svg"
          alt=""
          className="_shape_img"
          width={200}
          height={200}
        />
        <Image
          src="/images/dark_shape.svg"
          alt=""
          className="_dark_shape"
          width={200}
          height={200}
        />
      </div>
      <div className="_shape_two">
        <Image
          src="/images/shape2.svg"
          alt=""
          className="_shape_img"
          width={200}
          height={200}
        />
        <Image
          src="/images/dark_shape1.svg"
          alt=""
          className="_dark_shape _dark_shape_opacity"
          width={200}
          height={200}
        />
      </div>
      <div className="_shape_three">
        <Image
          src="/images/shape3.svg"
          alt=""
          className="_shape_img"
          width={200}
          height={200}
        />
        <Image
          src="/images/dark_shape2.svg"
          alt=""
          className="_dark_shape _dark_shape_opacity"
          width={200}
          height={200}
        />
      </div>
      <div className="_social_registration_wrap">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-xl-8 col-lg-8 col-md-12 col-sm-12">
              <div className="_social_registration_right">
                <div className="_social_registration_right_image">
                  <Image
                    src="/images/registration.png"
                    alt="Registration illustration"
                    width={800}
                    height={600}
                    priority
                  />
                </div>
                <div className="_social_registration_right_image_dark">
                  <Image
                    src="/images/registration1.png"
                    alt="Registration illustration"
                    width={800}
                    height={600}
                  />
                </div>
              </div>
            </div>
            <div className="col-xl-4 col-lg-4 col-md-12 col-sm-12">
              <div className="_social_registration_content">
                <div className="_social_registration_right_logo _mar_b28">
                  <Image
                    src="/images/logo.svg"
                    alt="Buddy Script logo"
                    className="_right_logo"
                    width={160}
                    height={40}
                  />
                </div>
                <p className="_social_registration_content_para _mar_b8">
                  Get Started Now
                </p>
                <h4 className="_social_registration_content_title _titl4 _mar_b50">
                  Registration
                </h4>
                <button
                  type="button"
                  className="_social_registration_content_btn _mar_b40"
                >
                  <Image
                    src="/images/google.svg"
                    alt="Google"
                    className="_google_img"
                    width={20}
                    height={20}
                  />{" "}
                  <span>Register with google</span>
                </button>
                <div className="_social_registration_content_bottom_txt _mar_b40">
                  <span>Or</span>
                </div>
                <SignupForm />
                <div className="row">
                  <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                    <div className="_social_registration_bottom_txt">
                      <p className="_social_registration_bottom_txt_para">
                        Already have an account?{" "}
                        <Link href="/login">Login</Link>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
