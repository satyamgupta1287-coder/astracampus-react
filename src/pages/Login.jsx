import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase-init";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export default function Login() {
  const navigate = useNavigate();

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [schoolCode, setSchoolCode] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && !isProcessing) {
        // If user is already logged in, redirect them
        checkRoleAndRedirect(user);
      }
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showError = (msg) => {
    let cleanMsg = msg.replace("Firebase: ", "");
    if (cleanMsg.includes("auth/user-not-found"))
      cleanMsg = "This email is not registered. Please Sign Up.";
    if (
      cleanMsg.includes("auth/wrong-password") ||
      cleanMsg.includes("auth/invalid-credential")
    )
      cleanMsg = "Incorrect credentials. Please try again.";
    if (cleanMsg.includes("auth/invalid-email"))
      cleanMsg = "Invalid email format.";

    setErrorMsg(cleanMsg);
    setIsProcessing(false);
  };

  const checkRoleAndRedirect = async (user) => {
    try {
      const docRef = doc(db, "users", user.uid);
      let docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        let assignedRole = "student";
        let assignedSchoolId = schoolCode.toUpperCase();

        const adminRef = doc(
          db,
          "pre_registered_admins",
          user.email.toLowerCase(),
        );
        const adminSnap = await getDoc(adminRef);

        if (adminSnap.exists()) {
          assignedRole = "admin";
          assignedSchoolId = adminSnap.data().schoolId;
        }

        if (assignedRole === "student" && !assignedSchoolId) {
          let manualCode = prompt("Please enter your School Code to continue:");
          if (!manualCode) {
            setIsProcessing(false);
            throw new Error("School Code is compulsory for Students!");
          }
          assignedSchoolId = manualCode.toUpperCase();
        }

        await setDoc(docRef, {
          name: user.displayName || "User",
          email: user.email.toLowerCase(),
          role: assignedRole,
          schoolId: assignedSchoolId,
          createdAt: serverTimestamp(),
        });

        docSnap = await getDoc(docRef);
      }

      const userData = docSnap.data();
      const userRole = (userData.role || "student").toLowerCase().trim();

      if (userRole === "admin") {
        navigate("/admin");
      } else if (userRole === "teacher" || userRole === "staff") {
        navigate("/teacher-dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      showError(err.message);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      let userCredential;
      if (isLoginMode) {
        userCredential = await signInWithEmailAndPassword(
          auth,
          email.toLowerCase(),
          password,
        );
        await checkRoleAndRedirect(userCredential.user);
      } else {
        userCredential = await createUserWithEmailAndPassword(
          auth,
          email.toLowerCase(),
          password,
        );
        await checkRoleAndRedirect(userCredential.user);
      }
    } catch (error) {
      showError(error.message);
    }
  };

  const handleForgotPassword = async () => {
    const cleanEmail = email.toLowerCase().trim();
    setErrorMsg("");
    setSuccessMsg("");

    if (!cleanEmail) {
      showError(
        "Please enter your Email address first, then click 'Forgot Password'.",
      );
      return;
    }

    setIsProcessing(true);

    try {
      const actionCodeSettings = {
        url: "https://astracampus.vercel.app/auth/action.html",
        handleCodeInApp: false,
      };

      await sendPasswordResetEmail(auth, cleanEmail, actionCodeSettings);

      setSuccessMsg("✅ Password reset link sent! Please check your email.");
      setIsProcessing(false);
    } catch (error) {
      showError(error.message);
    }
  };

  const handleGoogleAuth = async () => {
    setIsProcessing(true);
    setErrorMsg("");
    setSuccessMsg("");
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await checkRoleAndRedirect(result.user);
    } catch (error) {
      showError(error.message);
    }
  };

  return (
    <div className="bg-slate-50 flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-white p-8 rounded-[24px] shadow-xl w-full max-w-md border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
        <div className="text-center mb-8 mt-2">
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-1">
            Astra<span className="text-blue-600">Campus</span>
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            {isLoginMode
              ? "Welcome back! Please enter your details."
              : "Sign up to access the portal."}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
          {!isLoginMode && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                School Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required={!isLoginMode}
                value={schoolCode}
                onChange={(e) => setSchoolCode(e.target.value)}
                placeholder="e.g. DAV01"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 transition-all font-medium uppercase placeholder:normal-case"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@school.com"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 transition-all font-medium"
            />

            {isLoginMode && (
              <div className="text-right mt-2">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={isProcessing}
                  className="text-[12px] font-bold text-blue-600 hover:text-blue-700 hover:underline disabled:opacity-50 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            )}
          </div>

          {successMsg && (
            <p className="text-emerald-600 text-sm font-bold text-center bg-emerald-50 py-2.5 px-3 rounded-xl border border-emerald-100">
              {successMsg}
            </p>
          )}
          {errorMsg && (
            <p className="text-rose-500 text-sm font-bold text-center bg-rose-50 py-2.5 px-3 rounded-xl border border-rose-100">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] transition-all disabled:opacity-70 active:scale-[0.98]"
          >
            {isProcessing
              ? "Processing..."
              : isLoginMode
                ? "Sign In"
                : "Create Account"}
          </button>
        </form>

        <div className="mt-5 text-center">
          <button
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              setErrorMsg("");
              setSuccessMsg("");
            }}
            type="button"
            className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors"
          >
            {isLoginMode ? (
              <>
                Don't have an account?{" "}
                <span className="text-blue-600">Sign Up</span>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <span className="text-blue-600">Sign In</span>
              </>
            )}
          </button>
        </div>

        <div className="relative flex items-center justify-center w-full mt-7 mb-7">
          <div className="absolute w-full border-t border-slate-200"></div>
          <span className="bg-white px-4 text-[11px] text-slate-400 font-bold uppercase tracking-wider relative z-10">
            OR
          </span>
        </div>

        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={isProcessing}
          className="w-full bg-white border border-slate-200 text-slate-700 font-bold py-3.5 rounded-xl hover:bg-slate-50 hover:shadow-md transition-all flex justify-center items-center gap-3 disabled:opacity-50 active:scale-[0.98]"
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            className="w-5 h-5"
            alt="Google"
          />
          Continue with Google
        </button>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-slate-500 text-sm font-medium mb-1">
          Developed By{" "}
          <span className="font-bold text-slate-700">
            Satyam Tech Solutions
          </span>
        </p>
        <div className="flex items-center justify-center gap-4 text-xs font-medium text-slate-500 mb-2">
          <a
            href="tel:+919263258348"
            className="hover:text-blue-600 transition-colors flex items-center gap-1"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            +91 92632 58348
          </a>
          <span className="text-slate-300">|</span>
          <a
            href="tel:180012341234"
            className="hover:text-blue-600 transition-colors flex items-center gap-1"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            1800 1234 1234
          </a>
        </div>
        <a
          href="https://satyamtechsolutions.in"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100"
        >
          satyamtechsolutions.in
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </div>
    </div>
  );
}
