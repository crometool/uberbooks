'use strict';
/**
 * @ngdoc function
 * @name uberbooksApp.controller:LoginCtrl
 * @description
 * # LoginCtrl
 * Manages authentication to any active providers.
 */
angular.module('uberbooksApp')
    .controller('LoginCtrl', function ($scope, Auth, $location, $q, Ref, $timeout, Flash) {
        $scope.passwordLogin = function (email, pass) {
            $scope.err = null;
            Auth.$authWithPassword({
                email: email,
                password: pass
            }, {
                rememberMe: true
            }).then(
                redirect, showError
            );
        };

        $scope.createAccount = function (email, pass, confirm) {
            $scope.err = null;
            if (!pass) {
                $scope.err = 'Please enter a password';
            } else if (pass !== confirm) {
                $scope.err = 'Passwords do not match';
            } else {
                Auth.$createUser({
                        email: email,
                        password: pass
                    })
                    .then(function () {
                        // authenticate so we have permission to write to Firebase
                        return Auth.$authWithPassword({
                            email: email,
                            password: pass
                        }, {
                            rememberMe: true
                        });
                    })
                    .then(createProfile)
                    .then(redirect, showError);
            }

            function createProfile(user) {
                var ref = Ref.child('users').child(user.uid),
                    def = $q.defer();
                ref.set({
                    email: email,
                    name: firstPartOfEmail(email)
                }, function (err) {
                    $timeout(function () {
                        if (err) {
                            def.reject(err);
                        } else {
                            def.resolve(ref);
                        }
                    });
                });
                return def.promise;
            }
        };


        $scope.recoverPassword = function () {
            Ref.resetPassword({
                email: $scope.recover.email
            }, function (error) {
                if (error) {
                    switch (error.code) {
                    case "INVALID_USER":
                        Flash.create('danger', "The specified user account does not exist.");
                        console.log("The specified user account does not exist.");
                        break;
                    default:
                        Flash.create('danger', "Error resetting password");
                        console.log("Error resetting password:", error);
                    }
                } else {
                    Flash.create('success', "Password reset email sent successfuly!");
                    $scope.passwordMode = false;
                    console.log("Password reset email sent successfully!");
                }
            });
        };

        function firstPartOfEmail(email) {
            return ucfirst(email.substr(0, email.indexOf('@')) || '');
        }

        function ucfirst(str) {
            // inspired by: http://kevin.vanzonneveld.net
            str += '';
            var f = str.charAt(0).toUpperCase();
            return f + str.substr(1);
        }



        function redirect() {
            Flash.create('success', "Thank you for logging in!");
            $location.path('/home');
        }

        function showError(err) {
            //        if(Object.keys(err).length != 0){
            Flash.create('danger', "There was an error. Please try again.");
            $scope.err = err;
            //        }

        }


    });