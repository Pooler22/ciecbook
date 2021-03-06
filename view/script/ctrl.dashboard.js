﻿(function () {
    "use strict";

    angular
        .module("PZApp")
        .controller("DashboardCtrl", DashboardCtrl);

    DashboardCtrl.$inject = [
        "$scope",
        "$rootScope",
        "toaster",
        "NotificationApi",
        "SmsApi",
		"EmailApi",
		"GoogleService"
    ];
	
	const SPLIT_INDEX_SURNAME = 2;
	
	function concatGoogleUser(res1)
	{
       return res1.imię + ' ' + res1.nazwisko + ' ' +  res1.nr
	}

    function DashboardCtrl($scope, $rootScope, toaster, NotificationApi, SmsApi, EmailApi, GoogleService) {		
		 $scope.googleSheetUsers = undefined;
		
		 GoogleService.GetJsonWorkSheet.get().$promise
            .then((res) => {				
                $scope.predefRecipients = res.map(concatGoogleUser);				
            })
            .catch((err) => {
                console.log(err);                
            });      

        $scope.predefButtons = {
            pizza: {
                button: "Pizza",
                msg: "Na portierni czeka pizza zamówiona przez osobę z tego pokoju.",
                icon: "fa-cutlery"
            },
            package: {
                button: "Paczka",
                msg: "Na portierni czeka paczka zamówiona przez osobę z tego pokoju.",
                icon: "fa-archive"
            },
            manager: {
                button: "Wezwanie do kierownika",
                msg: "Wezwanie od kierownika.",
                icon: "fa-user"
            },
            portier: {
                button: "Wezwanie do portiera",
                msg: "Wezwanie do portiera.",
                icon: "fa-user-plus"

            }
        };

        $scope.recipient = "";
        $scope.content = "";
        $scope.showCustomNotification = false;

        $scope.sendNotification = (content) => {
            const sContent = content || $scope.content;
            if (!$scope.recipient || !sContent) {
                return;
            }

            NotificationApi.main.post({
                recipient: $scope.recipient.split(' ')[SPLIT_INDEX_SURNAME],
                content: sContent
            }).$promise
                .then((notification) => {
                    toaster.pop({
                        type: "success",
                        title: "Sukces!",
                        body: "Powiadomienie zostało wysłane.",
                        showCloseButton: true
                    });

                    SmsApi.send.post({
                        "notification_id": notification._id
                    }).$promise
                        .catch((err) => console.log(err));
						
					EmailApi.send.post({
                        "notification_id": notification._id
                     }).$promise
                         .catch((err) => console.log(err));

                    $scope.recipient = "";

                })
                .catch((err) => {
                    console.log(err);

                    toaster.pop({
                        type: "error",
                        title: "Porażka!",
                        body: "Nie udało się wysłać powiadomienia.",
                        showCloseButton: true
                    });
                });
        };

        $scope.sendPredefinedNotification = (key) => {
            const predefContent = $scope.predefButtons[key].msg;
            $scope.sendNotification(predefContent);
        };

        $scope.otherButton = () => {
            $scope.showCustomNotification = !$scope.showCustomNotification;
        }
    }
})();
