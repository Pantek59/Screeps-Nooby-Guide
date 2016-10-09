module.exports = {
    // a function to run the logic for this role
    run: function(creep, flag) {
        var strategy = flag.memory.strategy;
        var bunkerDown = false;
        var hostileCreeps = creep.room.find(FIND_CREEPS, {filter: function (creep) {return isHostile(creep)}});
        var friendlyCreeps = creep.room.find(FIND_CREEPS, {filter: function (creep) {return isHostile(creep) ? false : true}});

        switch (strategy) {
            case "remoteDrain":
                switch (creep.memory.role) {
                    case "attacker":
                    case "einarr":
                        if (creep.memory.role == "einarr" && creep.hits < creep.hitsMax) {
                            //Self-heal
                            creep.heal(creep);
                        }

                        if (creep.room.name == flag.pos.roomName) {
                            //Attacker outside target room
                            if (hostileCreeps.length > 0) {
                                //Enemies present -> attack
                                let target = creep.pos.findClosestByPath(hostileCreeps);
                                if (creep.attack(target) == ERR_NOT_IN_RANGE) {
                                    creep.moveTo(target);
                                }
                            }
                            else if (creep.hitsMax == creep.hits) {
                                //No enemies around and attacker ready
                                //Find direction to target room
                                let directionToTargetRoom;
                                if (flag.pos.x >= 45) {
                                    directionToTargetRoom = FIND_EXIT_RIGHT;
                                }
                                else if (flag.pos.x <= 5) {
                                    directionToTargetRoom = FIND_EXIT_LEFT;
                                }
                                else if (flag.pos.y <= 5) {
                                    directionToTargetRoom = FIND_EXIT_TOP;
                                }
                                else if (flag.pos.y >= 45) {
                                    directionToTargetRoom = FIND_EXIT_BOTTOM;
                                }
                                //Move to target room
                                let exitToTarget = flag.pos.findClosestByRange(directionToTargetRoom);
                                creep.moveTo(exitToTarget, {reusePath: 5});
                            }
                            else if (creep.pos.getRangeTo(flag) > 1) {
                                // Attacker outside room and wounded -> Go to flag and wait
                                creep.moveTo(flag, {reusePath: 8});
                            }
                        }
                        else {
                            // Attacker in target room
                            if (creep.hits < creep.hitsMax * 0.3) {
                                //Attacker damaged enough to withdraw
                                creep.moveTo(flag, {reusePath: 5});
                            }
                            else {
                                if (creep.pos.x == 0 || creep.pos.x == 49 || creep.pos.y == 0 || creep.pos.y == 49) {
                                    //Move away from exit
                                    creep.moveTo(creep.pos.findClosestByPath(FIND_STRUCTURES));
                                }
                            }
                        }
                        break;

                    case "healer":
                        if (creep.hits < creep.hitsMax) {
                            //Self-heal
                            creep.heal(creep);
                        }
                        if (flag.pos.roomName != creep.room.name) {
                            creep.moveTo(flag, {reusePath: 8});
                        }
                        else {
                            // Healer is in flag room
                            if (hostileCreeps.length > 0) {
                                //Hostiles near, flee!
                                creep.moveTo(hostileCreeps, {flee: true, reusePath: 5});
                            }
                            else if (friendlyCreeps.length > 0) {
                                //Look for nearest creep to flag needing help
                                var patient = flag.pos.findClosestByPath(FIND_CREEPS, {filter: function (creep) {return creep.hits < creep.hitsMax}});
                                if (patient != null) {
                                    if (creep.heal(patient) == ERR_NOT_IN_RANGE) {
                                        creep.moveTo(patient, {reusePath: 2});
                                    }
                                }
                            }

                            if (creep.pos.getRangeTo(flag) > 2) {
                                // Go to flag and wait
                                creep.moveTo(flag, {reusePath: 8});
                            }
                        }
                        break;
                }
                break;

            case "destroy":
                switch (creep.memory.role) {
                    case "attacker":
                    case "einarr":
                        if (creep.memory.role == "einarr" && creep.hits < creep.hitsMax) {
                            creep.heal(creep);
                        }

                        var target;
                        var targets = flag.pos.findInRange(hostileCreeps, 3);
                        if (targets.length > 0) {
                            //Hostile creeps within flag range -> attack
                            target = flag.pos.findClosestByPath(targets);
                            if (target != null && creep.attack(target) == ERR_NOT_IN_RANGE) {
                                creep.moveTo(target);
                            }
                        }

                        if (target == undefined || target == null) {
                            //No hostile creeps around or not path to them found -> attack structure
                            targets = flag.pos.lookFor(LOOK_STRUCTURES);
                            if (targets.length > 0) {
                                // Structure found
                                for (let t in targets) {
                                    if (targets[t].structureType != STRUCTURE_CONTROLLER && targets[t].structureType != STRUCTURE_ROAD) {
                                        target = targets[t];
                                    }
                                    break;
                                }

                                if (target != undefined) {
                                    if (creep.attack(target) == ERR_NOT_IN_RANGE) {
                                        creep.moveTo(target);
                                    }
                                }
                            }
                            else {
                                //No structure to attack found
                                bunkerDown = true;
                            }

                        }
                        break;

                    case "healer":
                        if (creep.hits < creep.hitsMax) {
                            creep.heal(creep);
                        }

                        var danger = creep.pos.findInRange(hostileCreeps, 2);
                        if (3 == 5 && danger.length > 0) {
                            creep.moveTo(danger, {flee: true, reusePath: 2});
                        }
                        else {
                            // No hostile creeps around
                            var patients = flag.pos.findInRange(friendlyCreeps, 5);
                            if (patients.length > 0) {
                                //Damaged creeps near flag found
                                let patient = creep.pos.findClosestByPath(patients, {filter: (s) => s.hits < s.hitsMax});
                                if (patient != null && creep.heal(patient) == ERR_NOT_IN_RANGE) {
                                    creep.moveTo(patient);
                                }
                                else {
                                    //No path to patient found
                                    if (creep.pos.getRangeTo(flag) > 3) {
                                        creep.moveTo(flag, {reusePath: 2});
                                    }
                                }
                            }
                            else {
                                //No damaged creeps around
                                if (creep.pos.getRangeTo(flag) > 3) {
                                    creep.moveTo(flag, {reusePath: 2});
                                }
                            }
                        }
                        break;
                }
                break;

            default:
                bunkerDown = true
                break;
        }

        if (bunkerDown == true) {
            switch (creep.memory.role) {
                case "attacker":
                case "einarr":
                    let target;
                    let targets = flag.pos.findInRange(hostileCreeps, 5);
                    if (targets.length > 0) {
                        //Hostile creeps within flag range -> attack
                        target = flag.pos.findClosestByPath(targets);
                        if (target != null && creep.attack(target) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(target);
                        }
                    }
                    else if (creep.memory.role == "einarr") {
                        let patients = flag.pos.findInRange(friendlyCreeps, 5);
                        if (patients.length > 0) {
                            //Damaged creeps near flag found
                            let patient = creep.pos.findClosestByPath(patients, {filter: (s) => s.hits < s.hitsMax});
                            if (patient != null && creep.heal(patient) == ERR_NOT_IN_RANGE) {
                                creep.moveTo(patient);
                            }
                            else {
                                //No path to patient found
                                if (creep.pos.getRangeTo(flag) > 2) {
                                    creep.moveTo(flag, {reusePath: 2});
                                }
                            }
                        }
                        else {
                            //No damaged creeps around
                            if (creep.pos.getRangeTo(flag) > 2) {
                                creep.moveTo(flag, {reusePath: 2});
                            }
                        }
                    }
                    else {
                        //No hostile creeps around
                        if (creep.pos.getRangeTo(flag) > 2) {
                            creep.moveTo(flag, {reusePath: 2});
                        }
                    }
                    break;

                case "healer":
                    let danger = creep.pos.findInRange(hostileCreeps, 2);
                    if (danger.length > 0) {
                        creep.moveTo(danger, {flee: true, reusePath: 2});
                    }
                    else {
                        // No hostile creeps around
                        let patients = flag.pos.findInRange(friendlyCreeps, 5);
                        if (patients.length > 0) {
                            //Damaged creeps near flag found
                            let patient = creep.pos.findClosestByPath(patients, {filter: (s) => s.hits < s.hitsMax});
                            if (patient != null && creep.heal(patient) == ERR_NOT_IN_RANGE) {
                                creep.moveTo(patient);
                            }
                            else {
                                //No path to patient found
                                if (creep.pos.getRangeTo(flag) > 2) {
                                    creep.moveTo(flag, {reusePath: 2});
                                }
                            }
                        }
                        else {
                            //No damaged creeps around
                            if (creep.pos.getRangeTo(flag) > 2) {
                                creep.moveTo(flag, {reusePath: 2});
                            }
                        }
                    }
                    break;
            }
        }
    }
};