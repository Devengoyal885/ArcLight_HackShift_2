/*====================================================================*/
/* SAS CU HACKATHON                                                   */
/*                                                                      */
/* INTEGRATED CAREER ANALYTICS PIPELINE                               */
/*                                                                      */
/* DATASETS                                                             */
/*   1. DataScience Jobs.csv                                           */
/*   2. Analytics Jobs.csv                                             */
/*   3. JDS Skill Traits.xlsx                                          */
/*   4. SDS Personality Traits.xlsx                                    */
/*                                                                      */
/* ANALYTICAL STREAMS                                                   */
/*                                                                      */
/* A. JOB MARKET                                                        */
/*      Demand / salary / experience / outliers                        */
/*                                                                      */
/* B. ANALYTICS JOBS                                                    */
/*      High-salary prediction                                         */
/*                                                                      */
/* C. JDS SKILLS                                                        */
/*      High salary-hike prediction                                    */
/*                                                                      */
/* D. SDS PERSONALITY                                                   */
/*      High senior-success prediction                                 */
/*                                                                      */
/* ML WORKFLOW                                                         */
/*      Profile                                                        */
/*        -> Missingness                                               */
/*        -> Outliers                                                  */
/*        -> Class balance                                             */
/*        -> Feature engineering                                       */
/*        -> Stratified train/test                                     */
/*        -> Randomized stratified 5-fold CV                            */
/*        -> Grid search                                               */
/*        -> Randomized search                                         */
/*        -> Final model                                               */
/*        -> Hold-out evaluation                                       */
/*        -> Saved SAS model                                           */
/*                                                                      */
/* NOTE                                                                */
/* SAS-native equivalents are used instead of Python joblib/          */
/* GridSearchCV/RandomizedSearchCV.                                    */
/*====================================================================*/


/*--------------------------------------------------------------------*/
/* 0. OPTIONS                                                         */
/*--------------------------------------------------------------------*/

options validvarname=any;
options mprint;
options dlcreatedir;

ods graphics on;

%let seed=20261007;
%let kfold=5;


/*--------------------------------------------------------------------*/
/* 1. PATHS                                                           */
/*--------------------------------------------------------------------*/

%let project_path=%sysget(HOME)/SAS_Hackathon;
%let raw_path=&project_path/Raw_Data;


/*--------------------------------------------------------------------*/
/* 2. FILE NAMES                                                      */
/*--------------------------------------------------------------------*/

%let ds_file=&raw_path/DataScience Jobs.csv;
%let analytics_file=&raw_path/Analytics Jobs.csv;
%let jds_file=&raw_path/JDS Skill Traits.xlsx;
%let sds_file=&raw_path/SDS Personality Traits.xlsx;


/*--------------------------------------------------------------------*/
/* 3. PERMANENT PROJECT LIBRARY                                     */
/*                                                                    */
/* This uses the existing SAS_Hackathon folder.                       */
/* No separate Models folder is required.                             */
/*--------------------------------------------------------------------*/

libname project "&project_path";


/*********************************************************************/
/*                                                                   */
/* PART A - IMPORT ALL FOUR DATASETS                                */
/*                                                                   */
/*********************************************************************/


/*-------------------------- DATA SCIENCE ----------------------------*/

proc import
    datafile="&ds_file"
    out=work.ds_raw
    dbms=csv
    replace;

    guessingrows=max;
    getnames=yes;

run;


/*-------------------------- ANALYTICS -------------------------------*/

proc import
    datafile="&analytics_file"
    out=work.analytics_raw
    dbms=csv
    replace;

    guessingrows=max;
    getnames=yes;

run;


/*-------------------------- JDS -------------------------------------*/

proc import
    datafile="&jds_file"
    out=work.jds_raw
    dbms=xlsx
    replace;

    getnames=yes;

run;


/*-------------------------- SDS -------------------------------------*/

proc import
    datafile="&sds_file"
    out=work.sds_raw
    dbms=xlsx
    replace;

    getnames=yes;

run;


/*********************************************************************/
/*                                                                   */
/* PART B - BASIC PROFILE                                           */
/*                                                                   */
/*********************************************************************/


title "DATASET RECORD COUNTS";

proc sql;

    select count(*) as DataScience_Jobs
    from work.ds_raw;

    select count(*) as Analytics_Jobs
    from work.analytics_raw;

    select count(*) as JDS_Records
    from work.jds_raw;

    select count(*) as SDS_Records
    from work.sds_raw;

quit;


/*-------------------------- STRUCTURES ------------------------------*/

title "Data Science Jobs - Structure";

proc contents data=work.ds_raw varnum;
run;


title "Analytics Jobs - Structure";

proc contents data=work.analytics_raw varnum;
run;


title "JDS Skill Traits - Structure";

proc contents data=work.jds_raw varnum;
run;


title "SDS Personality Traits - Structure";

proc contents data=work.sds_raw varnum;
run;


/*********************************************************************/
/*                                                                   */
/* PART C - DATA SCIENCE JOB MARKET                                 */
/*                                                                   */
/*********************************************************************/


/*--------------------------------------------------------------------*/
/* 1. CLEAN DATA SCIENCE JOBS                                        */
/*--------------------------------------------------------------------*/

data work.ds_clean;

    set work.ds_raw;

    length
        job_title_clean $100
        job_title_std $100;


    job_title_clean =
        strip(job_title);


    job_title_std =
        upcase(
            compbl(job_title_clean)
        );


    /* Salary values such as 7.8L become numeric 7.8 */

    avg_salary_num =
        input(
            prxchange(
                's/[^0-9.]//',
                -1,
                strip(avg_salary)
            ),
            best32.
        );


    min_salary_num =
        input(
            prxchange(
                's/[^0-9.]//',
                -1,
                strip(min_salary)
            ),
            best32.
        );


    max_salary_num =
        input(
            prxchange(
                's/[^0-9.]//',
                -1,
                strip(max_salary)
            ),
            best32.
        );


    if
        not missing(min_salary_num)
        and
        not missing(max_salary_num)

    then

        salary_range =
            max_salary_num -
            min_salary_num;


    invalid_salary_order=0;


    if
        min_salary_num > avg_salary_num
        or
        avg_salary_num > max_salary_num

    then

        invalid_salary_order=1;

run;


/*--------------------------------------------------------------------*/
/* 2. DATA SCIENCE DEMAND TABLE                                     */
/*--------------------------------------------------------------------*/

proc sql;

    create table work.ds_demand as

    select

        job_title_std
            as job_title length=100,

        count(*)
            as posting_records,

        sum(num_of_jobs)
            as total_jobs,

        mean(num_of_jobs)
            as avg_jobs_per_record,

        mean(avg_salary_num)
            as average_salary

    from work.ds_clean

    where not missing(job_title_std)

    group by job_title_std

    order by total_jobs desc;

quit;


title "Data Science Job Demand by Role";

proc print
    data=work.ds_demand
    noobs;

    var
        job_title
        posting_records
        total_jobs
        avg_jobs_per_record
        average_salary;

    format
        total_jobs comma12.
        avg_jobs_per_record comma12.2
        average_salary 8.2;

run;


/*--------------------------------------------------------------------*/
/* 3. DATA SCIENCE DEMAND GRAPH                                    */
/*--------------------------------------------------------------------*/

title "Top Data Science Roles by Job Demand";

proc sgplot
    data=work.ds_demand(obs=10);

    hbar job_title /

        response=total_jobs

        categoryorder=respdesc

        datalabel;

    xaxis
        label="Total Jobs"
        grid;

    yaxis
        label="Job Role";

run;


/*--------------------------------------------------------------------*/
/* 4. DATA SCIENCE OUTLIERS                                        */
/*--------------------------------------------------------------------*/

title "Data Science Salary - Outlier Visualization";

proc sgplot data=work.ds_clean;

    vbox avg_salary_num;

    yaxis
        label="Average Salary (Lakh)";

run;


title "Data Science Job Count - Outlier Visualization";

proc sgplot data=work.ds_clean;

    vbox num_of_jobs;

    yaxis
        label="Number of Jobs";

run;


title "Data Science Experience - Outlier Visualization";

proc sgplot data=work.ds_clean;

    vbox min_experience;

    yaxis
        label="Minimum Experience (Years)";

run;


/*********************************************************************/
/*                                                                   */
/* PART D - ANALYTICS JOB FEATURE ENGINEERING                       */
/*                                                                   */
/*********************************************************************/


/*--------------------------------------------------------------------*/
/* 5. CREATE ANALYTICS BASE TABLE                                   */
/*--------------------------------------------------------------------*/

data work.analytics_base;

    set work.analytics_raw;


    length

        job_desig_clean $150
        job_desig_std $150
        job_type_std $50
        location_primary $70
        salary_band_clean $20
        experience_group $20;


    /*------------------------ DESIGNATION --------------------------*/

    job_desig_clean =
        strip(job_desig);


    job_desig_std =
        upcase(
            compbl(
                job_desig_clean
            )
        );


    /*------------------------ JOB TYPE -----------------------------*/

    if missing(job_type)

    then

        job_type_std="UNKNOWN";

    else

        job_type_std=
            upcase(
                compbl(
                    strip(job_type)
                )
            );


    /*------------------------ LOCATION -----------------------------*/

    if missing(location)

    then

        location_primary="UNKNOWN";

    else

        location_primary=
            upcase(
                strip(
                    scan(
                        location,
                        1,
                        ','
                    )
                )
            );


    if location_primary="BANGALORE"

    then

        location_primary="BENGALURU";


    if location_primary="GURGAON"

    then

        location_primary="GURUGRAM";


    /*------------------------ EXPERIENCE ---------------------------*/

    experience_min =
        input(
            scan(
                strip(experience),
                1,
                '-'
            ),
            best32.
        );


    experience_max =
        input(
            scan(
                strip(experience),
                2,
                '-'
            ),
            best32.
        );


    if
        missing(experience_max)
        and
        not missing(experience_min)

    then

        experience_max =
            experience_min;


    if
        not missing(experience_min)
        and
        not missing(experience_max)

    then

        experience_mid =
            mean(
                experience_min,
                experience_max
            );


    if missing(experience_mid)

    then

        experience_group="UNKNOWN";

    else if experience_mid < 2

    then

        experience_group="0-1";

    else if experience_mid < 5

    then

        experience_group="2-4";

    else if experience_mid < 10

    then

        experience_group="5-9";

    else

        experience_group="10+";


    /*------------------------ SALARY BAND --------------------------*/

    salary_band_clean =
        strip(salary);


    /*------------------------ TARGET -------------------------------*/

    if
        salary_band_clean in
        (
            "15to25",
            "25to50"
        )

    then

        high_salary=1;

    else if
        salary_band_clean in
        (
            "0to3",
            "3to6",
            "6to10",
            "10to15"
        )

    then

        high_salary=0;

    else

        high_salary=.;


    /*------------------------ SKILLS -------------------------------*/

    if missing(key_skills)

    then

        skill_count=0;

    else

        skill_count =
            countw(
                key_skills,
                ','
            );


    skills_upper=
        upcase(
            strip(key_skills)
        );


    python_flag =
        (index(skills_upper,"PYTHON") > 0);


    sql_flag =
        (index(skills_upper,"SQL") > 0);


    machine_learning_flag =
        (index(
            skills_upper,
            "MACHINE LEARNING"
        ) > 0);


    tableau_flag =
        (index(skills_upper,"TABLEAU") > 0);


    powerbi_flag =
        (index(
            skills_upper,
            "POWER BI"
        ) > 0);


    sas_flag =
        (index(skills_upper,"SAS") > 0);


    /*------------------------ DESCRIPTION --------------------------*/

    description_length =
        lengthn(
            strip(job_description)
        );


    /*------------------------ QUALITY FLAGS ------------------------*/

    description_missing =
        missing(job_description);


    job_type_missing =
        missing(job_type);


    skill_missing =
        missing(key_skills);


    location_missing =
        missing(location);

run;


/*--------------------------------------------------------------------*/
/* 6. KEEP RECORDS WITH VALID TARGET                                */
/*--------------------------------------------------------------------*/

data work.analytics_ready;

    set work.analytics_base;

    if not missing(high_salary);

run;


/*********************************************************************/
/*                                                                   */
/* PART E - ANALYTICS MISSINGNESS                                   */
/*                                                                   */
/*********************************************************************/


proc sql;

    create table work.analytics_missing as

    select
        "Job Description"
            as variable length=30,
        sum(description_missing)
            as missing_count,
        count(*)
            as total_count
    from work.analytics_ready

    union all

    select
        "Job Type",
        sum(job_type_missing),
        count(*)
    from work.analytics_ready

    union all

    select
        "Key Skills",
        sum(skill_missing),
        count(*)
    from work.analytics_ready

    union all

    select
        "Location",
        sum(location_missing),
        count(*)
    from work.analytics_ready;

quit;


data work.analytics_missing;

    set work.analytics_missing;

    missing_percent =
        100 *
        missing_count /
        total_count;

run;


title "Analytics Jobs - Missing Data";

proc sgplot
    data=work.analytics_missing;

    vbar variable /

        response=missing_percent

        datalabel;

    yaxis
        label="Missing Records (%)"
        grid;

run;


/*********************************************************************/
/*                                                                   */
/* PART F - ANALYTICS CLASS BALANCE                                 */
/*                                                                   */
/*********************************************************************/


proc freq
    data=work.analytics_ready
    noprint;

    tables salary_band_clean /
        out=work.analytics_salary_dist;

run;


title "Analytics Jobs - Salary Band Distribution";

proc sgplot
    data=work.analytics_salary_dist;

    vbar salary_band_clean /

        response=count

        datalabel

        categoryorder=respdesc;

    yaxis
        label="Job Postings"
        grid;

run;


/*--------------------------------------------------------------------*/
/* Binary class balance                                              */
/*--------------------------------------------------------------------*/

proc freq
    data=work.analytics_ready
    noprint;

    tables high_salary /
        out=work.analytics_class_dist;

run;


title "Analytics Jobs - High Salary Class Balance";

proc sgplot
    data=work.analytics_class_dist;

    vbar high_salary /

        response=count

        datalabel;

    yaxis
        label="Number of Records"
        grid;

    xaxis
        label="0 = Lower Salary | 1 = High Salary";

run;


/*********************************************************************/
/*                                                                   */
/* PART G - ANALYTICS OUTLIERS                                      */
/*                                                                   */
/*********************************************************************/


title "Analytics Experience - Boxplot";

proc sgplot data=work.analytics_ready;

    vbox experience_mid;

    yaxis
        label="Experience Midpoint";

run;


title "Analytics Skill Count - Boxplot";

proc sgplot data=work.analytics_ready;

    vbox skill_count;

    yaxis
        label="Number of Skills";

run;


title "Analytics Description Length - Boxplot";

proc sgplot data=work.analytics_ready;

    vbox description_length;

    yaxis
        label="Description Length";

run;


/*--------------------------------------------------------------------*/
/* 7. IQR CUTOFFS                                                    */
/*--------------------------------------------------------------------*/

proc univariate
    data=work.analytics_ready
    noprint;

    var
        experience_mid
        skill_count
        description_length;

    output
        out=work.analytics_q
        q1=
            exp_q1
            skill_q1
            desc_q1
        q3=
            exp_q3
            skill_q3
            desc_q3;

run;


/*--------------------------------------------------------------------*/
/* 8. CREATE OUTLIER FLAGS + CAPPED VALUES                          */
/*--------------------------------------------------------------------*/

data work.analytics_outliers;

    if _n_=1

    then

        set work.analytics_q;


    set work.analytics_ready;


    /*------------------------ EXPERIENCE ---------------------------*/

    exp_iqr =
        exp_q3 -
        exp_q1;


    exp_lower =
        exp_q1 -
        1.5 * exp_iqr;


    exp_upper =
        exp_q3 +
        1.5 * exp_iqr;


    if
        not missing(experience_mid)
        and
        (
            experience_mid < exp_lower
            or
            experience_mid > exp_upper
        )

    then

        experience_outlier=1;

    else

        experience_outlier=0;


    experience_cap =
        experience_mid;


    if experience_mid < exp_lower

    then

        experience_cap =
            exp_lower;

    else if experience_mid > exp_upper

    then

        experience_cap =
            exp_upper;


    /*------------------------ SKILLS -------------------------------*/

    skill_iqr =
        skill_q3 -
        skill_q1;


    skill_lower =
        skill_q1 -
        1.5 * skill_iqr;


    skill_upper =
        skill_q3 +
        1.5 * skill_iqr;


    if
        not missing(skill_count)
        and
        (
            skill_count < skill_lower
            or
            skill_count > skill_upper
        )

    then

        skill_outlier=1;

    else

        skill_outlier=0;


    skill_count_cap =
        skill_count;


    if skill_count < skill_lower

    then

        skill_count_cap =
            skill_lower;

    else if skill_count > skill_upper

    then

        skill_count_cap =
            skill_upper;


    /*------------------------ DESCRIPTION --------------------------*/

    desc_iqr =
        desc_q3 -
        desc_q1;


    desc_lower =
        desc_q1 -
        1.5 * desc_iqr;


    desc_upper =
        desc_q3 +
        1.5 * desc_iqr;


    if
        not missing(description_length)
        and
        (
            description_length < desc_lower
            or
            description_length > desc_upper
        )

    then

        description_outlier=1;

    else

        description_outlier=0;


    description_length_cap =
        description_length;


    if description_length < desc_lower

    then

        description_length_cap =
            desc_lower;

    else if description_length > desc_upper

    then

        description_length_cap =
            desc_upper;

run;


/*--------------------------------------------------------------------*/
/* 9. OUTLIER SUMMARY GRAPH                                         */
/*--------------------------------------------------------------------*/

proc sql;

    create table work.analytics_outlier_summary as

    select
        "Experience" as variable length=30,
        sum(experience_outlier) as outlier_count
    from work.analytics_outliers

    union all

    select
        "Skill Count",
        sum(skill_outlier)
    from work.analytics_outliers

    union all

    select
        "Description Length",
        sum(description_outlier)
    from work.analytics_outliers;

quit;


title "Analytics Jobs - Potential Outliers";

proc sgplot
    data=work.analytics_outlier_summary;

    vbar variable /

        response=outlier_count

        datalabel;

    yaxis
        label="Potential Outliers"
        grid;

run;


/*********************************************************************/
/*                                                                   */
/* PART H - HIGH CARDINALITY CONTROL                                */
/*                                                                   */
/*********************************************************************/


/*--------------------------------------------------------------------*/
/* 10. TOP JOB DESIGNATIONS                                         */
/*--------------------------------------------------------------------*/

proc freq
    data=work.analytics_outliers
    noprint;

    tables job_desig_std /
        out=work.analytics_role_freq;

run;


proc sort
    data=work.analytics_role_freq
    out=work.analytics_role_freq_sorted;

    by descending count;

run;


/*--------------------------------------------------------------------*/
/* 11. TOP LOCATIONS                                                 */
/*--------------------------------------------------------------------*/

proc freq
    data=work.analytics_outliers
    noprint;

    tables location_primary /
        out=work.analytics_location_freq;

run;


proc sort
    data=work.analytics_location_freq
    out=work.analytics_location_freq_sorted;

    by descending count;

run;


/*--------------------------------------------------------------------*/
/* 12. RETAIN TOP 20 ROLES                                         */
/*--------------------------------------------------------------------*/

data work.analytics_top_roles;

    set work.analytics_role_freq_sorted(obs=20);

    keep job_desig_std;

run;


/*--------------------------------------------------------------------*/
/* 13. RETAIN TOP 15 LOCATIONS                                     */
/*--------------------------------------------------------------------*/

data work.analytics_top_locations;

    set work.analytics_location_freq_sorted(obs=15);

    keep location_primary;

run;


/*--------------------------------------------------------------------*/
/* 14. FINAL ANALYTICS FEATURE TABLE                               */
/*--------------------------------------------------------------------*/

proc sql;

    create table work.analytics_features as

    select

        a.*,


        case

            when
                r.job_desig_std is not null

            then
                a.job_desig_std

            else
                "OTHER"

        end

        as role_group length=150,


        case

            when
                l.location_primary is not null

            then
                a.location_primary

            else
                "OTHER"

        end

        as location_group length=70


    from
        work.analytics_outliers as a


    left join
        work.analytics_top_roles as r

        on
            a.job_desig_std =
            r.job_desig_std


    left join
        work.analytics_top_locations as l

        on
            a.location_primary =
            l.location_primary;

quit;


/*********************************************************************/
/*                                                                   */
/* PART I - GENERIC STRATIFIED FOLD MACRO                            */
/*                                                                   */
/*********************************************************************/


%macro make_folds(

    input=
    ,
    target=
    ,
    output=

);


    data work._fold_random;

        set &input;


        if _n_=1

        then

            call streaminit(&seed);


        random_order =
            rand("uniform");

    run;


    proc sort

        data=work._fold_random

        out=work._fold_sorted;

        by

            &target
            random_order;

    run;


    data &output;

        set work._fold_sorted;

        by &target;


        retain fold_counter;


        if first.&target

        then

            fold_counter=0;


        fold_counter + 1;


        fold =
            mod(
                fold_counter - 1,
                &kfold
            ) + 1;


        drop
            fold_counter
            random_order;

    run;


%mend;


/*********************************************************************/
/*                                                                   */
/* PART J - GENERIC CLASSIFICATION CV MACRO                         */
/*                                                                   */
/*********************************************************************/


%macro run_cv(

    data=
    ,
    target=
    ,
    folds=
    ,
    config=
    ,
    cutoff=
    ,
    predictors=
    ,
    classvars=
    ,
    weightvar=
    ,
    results=

);


    %do cv_fold=1 %to &kfold;


        /*-------------------- TRAIN FOLD --------------------------*/

        data work._train_fold;

            set &folds;

            if fold ne &cv_fold;

        run;


        /*-------------------- VALIDATION FOLD --------------------*/

        data work._valid_fold;

            set &folds;

            if fold = &cv_fold;

        run;


        /*-------------------- MODEL -------------------------------*/

        proc logistic

            data=work._train_fold

            noprint;


            %if %length(%superq(classvars)) > 0 %then %do;

                class
                    &classvars
                    / param=ref;

            %end;


            model

                &target(event="1")

                =

                &predictors;


            %if %length(%superq(weightvar)) > 0 %then %do;

                weight &weightvar;

            %end;


            score

                data=work._valid_fold

                out=work._score_fold;

        run;


        /*-------------------- PREDICTIONS -------------------------*/

        data work._pred_fold;

            set work._score_fold;


            predicted_probability =
                P_1;


            if
                not missing(predicted_probability)
                and
                predicted_probability >= &cutoff

            then

                predicted_class=1;

            else

                predicted_class=0;


        run;


        /*-------------------- METRICS -----------------------------*/

        proc sql;

            create table work._fold_metrics as

            select

                "&config"
                    as config length=20,

                &cv_fold
                    as fold,

                &cutoff
                    as cutoff,


                mean(
                    predicted_class =
                    &target
                )
                    as accuracy,


                sum(
                    predicted_class=1
                    and
                    &target=1
                )
                    as tp,


                sum(
                    predicted_class=0
                    and
                    &target=0
                )
                    as tn,


                sum(
                    predicted_class=1
                    and
                    &target=0
                )
                    as fp,


                sum(
                    predicted_class=0
                    and
                    &target=1
                )
                    as fn

            from
                work._pred_fold;

        quit;


        /*-------------------- DERIVED METRICS ---------------------*/

        data work._fold_metrics2;

            set work._fold_metrics;


            precision =
                tp /
                max(
                    tp + fp,
                    1
                );


            recall =
                tp /
                max(
                    tp + fn,
                    1
                );


            specificity =
                tn /
                max(
                    tn + fp,
                    1
                );


            f1 =
                2 *
                precision *
                recall
                /
                max(
                    precision + recall,
                    .000001
                );


            balanced_accuracy =
                (
                    recall +
                    specificity
                )
                / 2;

        run;


        proc append

            base=&results

            data=work._fold_metrics2

            force;

        run;


    %end;


%mend;


/*********************************************************************/
/*                                                                   */
/* PART K - ANALYTICS STRATIFIED TRAIN/TEST                         */
/*                                                                   */
/*********************************************************************/


proc sort

    data=work.analytics_features

    out=work.analytics_sorted;

    by high_salary;

run;


proc surveyselect

    data=work.analytics_sorted

    out=work.analytics_sample

    samprate=0.80

    seed=&seed

    method=srs

    outall;

    strata high_salary;

run;


data work.analytics_train
     work.analytics_test;

    set work.analytics_sample;


    if selected=1

    then

        output work.analytics_train;

    else

        output work.analytics_test;

run;


/*--------------------------------------------------------------------*/
/* 15. ANALYTICS CLASS WEIGHTS                                     */
/*--------------------------------------------------------------------*/

proc sql noprint;

    select count(*)
    into :an_total
    from work.analytics_train;


    select count(*)
    into :an_low
    from work.analytics_train
    where high_salary=0;


    select count(*)
    into :an_high
    from work.analytics_train
    where high_salary=1;

quit;


%let an_weight_low =
    %sysevalf(
        &an_total /
        (2*&an_low)
    );


%let an_weight_high =
    %sysevalf(
        &an_total /
        (2*&an_high)
    );


data work.analytics_train;

    set work.analytics_train;


    if high_salary=0

    then

        class_weight=&an_weight_low;

    else

        class_weight=&an_weight_high;

run;


/*--------------------------------------------------------------------*/
/* 16. ANALYTICS RANDOMIZED STRATIFIED FOLDS                      */
/*--------------------------------------------------------------------*/

%make_folds(

    input=work.analytics_train,

    target=high_salary,

    output=work.analytics_cv

);


/*--------------------------------------------------------------------*/
/* 17. ANALYTICS GRID RESULTS                                      */
/*--------------------------------------------------------------------*/

data work.analytics_grid_results;

    length

        config $20
        fold 8
        cutoff 8
        accuracy 8
        precision 8
        recall 8
        specificity 8
        f1 8
        balanced_accuracy 8;

    stop;

run;


/*-------------------- ANALYTICS G1 -------------------------------*/

%run_cv(

    data=work.analytics_train,

    target=high_salary,

    folds=work.analytics_cv,

    config=G1,

    cutoff=0.40,

    predictors=
        experience_cap
        role_group,

    classvars=
        role_group,

    weightvar=class_weight,

    results=work.analytics_grid_results

);


%run_cv(

    data=work.analytics_train,

    target=high_salary,

    folds=work.analytics_cv,

    config=G1,

    cutoff=0.50,

    predictors=
        experience_cap
        role_group,

    classvars=
        role_group,

    weightvar=class_weight,

    results=work.analytics_grid_results

);


%run_cv(

    data=work.analytics_train,

    target=high_salary,

    folds=work.analytics_cv,

    config=G1,

    cutoff=0.60,

    predictors=
        experience_cap
        role_group,

    classvars=
        role_group,

    weightvar=class_weight,

    results=work.analytics_grid_results

);


/*-------------------- ANALYTICS G2 -------------------------------*/

%run_cv(

    data=work.analytics_train,

    target=high_salary,

    folds=work.analytics_cv,

    config=G2,

    cutoff=0.40,

    predictors=
        experience_cap
        role_group
        location_group,

    classvars=
        role_group
        location_group,

    weightvar=class_weight,

    results=work.analytics_grid_results

);


%run_cv(

    data=work.analytics_train,

    target=high_salary,

    folds=work.analytics_cv,

    config=G2,

    cutoff=0.50,

    predictors=
        experience_cap
        role_group
        location_group,

    classvars=
        role_group
        location_group,

    weightvar=class_weight,

    results=work.analytics_grid_results

);


%run_cv(

    data=work.analytics_train,

    target=high_salary,

    folds=work.analytics_cv,

    config=G2,

    cutoff=0.60,

    predictors=
        experience_cap
        role_group
        location_group,

    classvars=
        role_group
        location_group,

    weightvar=class_weight,

    results=work.analytics_grid_results

);


/*-------------------- ANALYTICS G3 -------------------------------*/

%run_cv(

    data=work.analytics_train,

    target=high_salary,

    folds=work.analytics_cv,

    config=G3,

    cutoff=0.40,

    predictors=
        experience_cap
        role_group
        location_group
        skill_count_cap
        python_flag
        sql_flag
        machine_learning_flag
        tableau_flag
        powerbi_flag
        sas_flag,

    classvars=
        role_group
        location_group,

    weightvar=class_weight,

    results=work.analytics_grid_results

);


%run_cv(

    data=work.analytics_train,

    target=high_salary,

    folds=work.analytics_cv,

    config=G3,

    cutoff=0.50,

    predictors=
        experience_cap
        role_group
        location_group
        skill_count_cap
        python_flag
        sql_flag
        machine_learning_flag
        tableau_flag
        powerbi_flag
        sas_flag,

    classvars=
        role_group
        location_group,

    weightvar=class_weight,

    results=work.analytics_grid_results

);


%run_cv(

    data=work.analytics_train,

    target=high_salary,

    folds=work.analytics_cv,

    config=G3,

    cutoff=0.60,

    predictors=
        experience_cap
        role_group
        location_group
        skill_count_cap
        python_flag
        sql_flag
        machine_learning_flag
        tableau_flag
        powerbi_flag
        sas_flag,

    classvars=
        role_group
        location_group,

    weightvar=class_weight,

    results=work.analytics_grid_results

);


/*--------------------------------------------------------------------*/
/* 18. ANALYTICS GRID SUMMARY                                      */
/*--------------------------------------------------------------------*/

proc sql;

    create table work.analytics_grid_summary as

    select

        config,

        cutoff,

        mean(accuracy)
            as cv_accuracy format=8.4,

        mean(f1)
            as cv_f1 format=8.4,

        mean(balanced_accuracy)
            as cv_balanced_accuracy format=8.4

    from work.analytics_grid_results

    group by
        config,
        cutoff

    order by
        cv_f1 desc;

quit;


title "Analytics - Grid Search Results";

proc print
    data=work.analytics_grid_summary
    noobs;

run;


/*********************************************************************/
/*                                                                   */
/* PART L - ANALYTICS RANDOMIZED SEARCH                            */
/*                                                                   */
/*********************************************************************/


data work.analytics_random_configs;

    if _n_=1

    then

        call streaminit(&seed);


    do iteration=1 to 8;

        model_number=
            rand(
                "integer",
                1,
                3
            );


        threshold_number=
            rand(
                "integer",
                1,
                3
            );


        if threshold_number=1
            then cutoff=0.40;

        else if threshold_number=2
            then cutoff=0.50;

        else
            cutoff=0.60;


        output;

    end;


    drop threshold_number;

run;


data work.analytics_random_results;

    length

        config $20
        fold 8
        cutoff 8
        accuracy 8
        precision 8
        recall 8
        specificity 8
        f1 8
        balanced_accuracy 8;

    stop;

run;


/*--------------------------------------------------------------------*/
/* 19. ANALYTICS RANDOMIZED SEARCH MACRO                           */
/*--------------------------------------------------------------------*/

%macro analytics_random_search;


    %do iteration=1 %to 8;


        data _null_;

            set work.analytics_random_configs(

                firstobs=&iteration
                obs=&iteration

            );


            call symputx(
                "rm",
                model_number
            );


            call symputx(
                "rc",
                cutoff
            );

        run;


        %if &rm=1 %then %do;

            %let rconfig=R1;

            %let rpred=
                experience_cap
                role_group;

            %let rclass=
                role_group;

        %end;


        %else %if &rm=2 %then %do;

            %let rconfig=R2;

            %let rpred=
                experience_cap
                role_group
                location_group;

            %let rclass=
                role_group
                location_group;

        %end;


        %else %do;

            %let rconfig=R3;

            %let rpred=
                experience_cap
                role_group
                location_group
                skill_count_cap
                python_flag
                sql_flag
                machine_learning_flag
                tableau_flag
                powerbi_flag
                sas_flag;

            %let rclass=
                role_group
                location_group;

        %end;


        %run_cv(

            data=work.analytics_train,

            target=high_salary,

            folds=work.analytics_cv,

            config=&rconfig,

            cutoff=&rc,

            predictors=&rpred,

            classvars=&rclass,

            weightvar=class_weight,

            results=work.analytics_random_results

        );


    %end;


%mend;


%analytics_random_search;


/*--------------------------------------------------------------------*/
/* 20. ANALYTICS RANDOM SEARCH SUMMARY                              */
/*--------------------------------------------------------------------*/

proc sql;

    create table work.analytics_random_summary as

    select

        config,

        cutoff,

        mean(accuracy)
            as cv_accuracy format=8.4,

        mean(f1)
            as cv_f1 format=8.4,

        mean(balanced_accuracy)
            as cv_balanced_accuracy format=8.4

    from work.analytics_random_results

    group by
        config,
        cutoff

    order by
        cv_f1 desc;

quit;


title "Analytics - Randomized Search Results";

proc print
    data=work.analytics_random_summary
    noobs;

run;


/*********************************************************************/
/*                                                                   */
/* PART M - JDS SKILL TRAITS                                        */
/*                                                                   */
/*********************************************************************/


/*--------------------------------------------------------------------*/
/* 21. CREATE JDS SAFE VARIABLES                                    */
/*                                                                    */
/* Actual source name is maths-stats_skills.                         */
/*--------------------------------------------------------------------*/

data work.jds_base;

    set work.jds_raw;


    maths_stats_skills =
        'maths-stats_skills'n;


    salary_hike_target =
        salary_hike_high_or_low;

run;


/*--------------------------------------------------------------------*/
/* 22. JDS PROFILE                                                 */
/*--------------------------------------------------------------------*/

title "JDS Skill Statistics";

proc means
    data=work.jds_base

    n
    nmiss
    mean
    median
    std
    min
    q1
    q3
    max;

    var

        big_data_skills
        maths_stats_skills
        coding_skills
        ai_and_ml_skills
        dashboard_and_storytelling_skills;

run;


/*--------------------------------------------------------------------*/
/* 23. JDS CLASS BALANCE                                           */
/*--------------------------------------------------------------------*/

proc freq
    data=work.jds_base

    noprint;

    tables salary_hike_target /
        out=work.jds_class;

run;


title "JDS - Salary Hike Class Balance";

proc sgplot
    data=work.jds_class;

    vbar salary_hike_target /

        response=count

        datalabel;

    yaxis
        label="Junior Data Scientists"
        grid;

run;


/*--------------------------------------------------------------------*/
/* 24. JDS OUTLIER VISUALS                                         */
/*--------------------------------------------------------------------*/

title "JDS - Big Data Skills";

proc sgplot data=work.jds_base;

    vbox big_data_skills;

    yaxis
        label="Score";

run;


title "JDS - Maths Statistics Skills";

proc sgplot data=work.jds_base;

    vbox maths_stats_skills;

    yaxis
        label="Score";

run;


title "JDS - Coding Skills";

proc sgplot data=work.jds_base;

    vbox coding_skills;

    yaxis
        label="Score";

run;


title "JDS - AI ML Skills";

proc sgplot data=work.jds_base;

    vbox ai_and_ml_skills;

    yaxis
        label="Score";

run;


title "JDS - Dashboard Storytelling Skills";

proc sgplot data=work.jds_base;

    vbox dashboard_and_storytelling_skills;

    yaxis
        label="Score";

run;


/*********************************************************************/
/*                                                                   */
/* PART N - JDS TRAIN / TEST                                       */
/*                                                                   */
/*********************************************************************/


proc sort

    data=work.jds_base

    out=work.jds_sorted;

    by salary_hike_target;

run;


proc surveyselect

    data=work.jds_sorted

    out=work.jds_sample

    samprate=0.80

    seed=&seed

    method=srs

    outall;

    strata salary_hike_target;

run;


data work.jds_train
     work.jds_test;

    set work.jds_sample;


    if selected=1

    then

        output work.jds_train;

    else

        output work.jds_test;

run;


/*--------------------------------------------------------------------*/
/* 25. JDS RANDOMIZED STRATIFIED FOLDS                            */
/*--------------------------------------------------------------------*/

%make_folds(

    input=work.jds_train,

    target=salary_hike_target,

    output=work.jds_cv

);


/*--------------------------------------------------------------------*/
/* 26. JDS GRID RESULTS                                            */
/*--------------------------------------------------------------------*/
/*
   JDS is already approximately balanced.
   No artificial oversampling is applied.
*/

data work.jds_grid_results;

    length

        config $20
        fold 8
        cutoff 8
        accuracy 8
        precision 8
        recall 8
        specificity 8
        f1 8
        balanced_accuracy 8;

    stop;

run;


/* J1 = ALL FIVE SKILLS */

%run_cv(

    data=work.jds_train,

    target=salary_hike_target,

    folds=work.jds_cv,

    config=J1,

    cutoff=0.40,

    predictors=
        big_data_skills
        maths_stats_skills
        coding_skills
        ai_and_ml_skills
        dashboard_and_storytelling_skills,

    classvars=,

    weightvar=,

    results=work.jds_grid_results

);


%run_cv(

    data=work.jds_train,

    target=salary_hike_target,

    folds=work.jds_cv,

    config=J1,

    cutoff=0.50,

    predictors=
        big_data_skills
        maths_stats_skills
        coding_skills
        ai_and_ml_skills
        dashboard_and_storytelling_skills,

    classvars=,

    weightvar=,

    results=work.jds_grid_results

);


%run_cv(

    data=work.jds_train,

    target=salary_hike_target,

    folds=work.jds_cv,

    config=J1,

    cutoff=0.60,

    predictors=
        big_data_skills
        maths_stats_skills
        coding_skills
        ai_and_ml_skills
        dashboard_and_storytelling_skills,

    classvars=,

    weightvar=,

    results=work.jds_grid_results

);


/* J2 = CORE TECHNICAL */

%run_cv(

    data=work.jds_train,

    target=salary_hike_target,

    folds=work.jds_cv,

    config=J2,

    cutoff=0.40,

    predictors=
        maths_stats_skills
        coding_skills
        ai_and_ml_skills,

    classvars=,

    weightvar=,

    results=work.jds_grid_results

);


%run_cv(

    data=work.jds_train,

    target=salary_hike_target,

    folds=work.jds_cv,

    config=J2,

    cutoff=0.50,

    predictors=
        maths_stats_skills
        coding_skills
        ai_and_ml_skills,

    classvars=,

    weightvar=,

    results=work.jds_grid_results

);


%run_cv(

    data=work.jds_train,

    target=salary_hike_target,

    folds=work.jds_cv,

    config=J2,

    cutoff=0.60,

    predictors=
        maths_stats_skills
        coding_skills
        ai_and_ml_skills,

    classvars=,

    weightvar=,

    results=work.jds_grid_results

);


/* J3 = FOUR TECHNICAL */

%run_cv(

    data=work.jds_train,

    target=salary_hike_target,

    folds=work.jds_cv,

    config=J3,

    cutoff=0.40,

    predictors=
        big_data_skills
        maths_stats_skills
        coding_skills
        ai_and_ml_skills,

    classvars=,

    weightvar=,

    results=work.jds_grid_results

);


%run_cv(

    data=work.jds_train,

    target=salary_hike_target,

    folds=work.jds_cv,

    config=J3,

    cutoff=0.50,

    predictors=
        big_data_skills
        maths_stats_skills
        coding_skills
        ai_and_ml_skills,

    classvars=,

    weightvar=,

    results=work.jds_grid_results

);


%run_cv(

    data=work.jds_train,

    target=salary_hike_target,

    folds=work.jds_cv,

    config=J3,

    cutoff=0.60,

    predictors=
        big_data_skills
        maths_stats_skills
        coding_skills
        ai_and_ml_skills,

    classvars=,

    weightvar=,

    results=work.jds_grid_results

);


/*--------------------------------------------------------------------*/
/* 27. JDS GRID SUMMARY                                            */
/*--------------------------------------------------------------------*/

proc sql;

    create table work.jds_grid_summary as

    select

        config,

        cutoff,

        mean(accuracy)
            as cv_accuracy format=8.4,

        mean(f1)
            as cv_f1 format=8.4,

        mean(balanced_accuracy)
            as cv_balanced_accuracy format=8.4

    from work.jds_grid_results

    group by
        config,
        cutoff

    order by
        cv_f1 desc;

quit;


title "JDS - Grid Search Results";

proc print

    data=work.jds_grid_summary

    noobs;

run;


/*********************************************************************/
/*                                                                   */
/* PART O - JDS RANDOMIZED SEARCH                                  */
/*                                                                   */
/*********************************************************************/


data work.jds_random_configs;

    if _n_=1

    then
        call streaminit(&seed);


    do iteration=1 to 8;

        model_number=
            rand(
                "integer",
                1,
                3
            );


        threshold_number=
            rand(
                "integer",
                1,
                3
            );


        if threshold_number=1

        then cutoff=0.40;

        else if threshold_number=2

        then cutoff=0.50;

        else cutoff=0.60;


        output;

    end;


    drop threshold_number;

run;


data work.jds_random_results;

    length

        config $20
        fold 8
        cutoff 8
        accuracy 8
        precision 8
        recall 8
        specificity 8
        f1 8
        balanced_accuracy 8;

    stop;

run;


%macro jds_random_search;


    %do iteration=1 %to 8;


        data _null_;

            set work.jds_random_configs(

                firstobs=&iteration
                obs=&iteration

            );


            call symputx(
                "jm",
                model_number
            );


            call symputx(
                "jc",
                cutoff
            );

        run;


        %if &jm=1 %then %do;

            %let jconfig=RJ1;

            %let jpred=
                big_data_skills
                maths_stats_skills
                coding_skills
                ai_and_ml_skills
                dashboard_and_storytelling_skills;

        %end;


        %else %if &jm=2 %then %do;

            %let jconfig=RJ2;

            %let jpred=
                maths_stats_skills
                coding_skills
                ai_and_ml_skills;

        %end;


        %else %do;

            %let jconfig=RJ3;

            %let jpred=
                big_data_skills
                maths_stats_skills
                coding_skills
                ai_and_ml_skills;

        %end;


        %run_cv(

            data=work.jds_train,

            target=salary_hike_target,

            folds=work.jds_cv,

            config=&jconfig,

            cutoff=&jc,

            predictors=&jpred,

            classvars=,

            weightvar=,

            results=work.jds_random_results

        );


    %end;


%mend;


%jds_random_search;


/*--------------------------------------------------------------------*/
/* 28. JDS RANDOMIZED SEARCH SUMMARY                               */
/*--------------------------------------------------------------------*/

proc sql;

    create table work.jds_random_summary as

    select

        config,

        cutoff,

        mean(accuracy)
            as cv_accuracy format=8.4,

        mean(f1)
            as cv_f1 format=8.4,

        mean(balanced_accuracy)
            as cv_balanced_accuracy format=8.4

    from work.jds_random_results

    group by
        config,
        cutoff

    order by
        cv_f1 desc;

quit;


title "JDS - Randomized Search Results";

proc print

    data=work.jds_random_summary

    noobs;

run;


/*********************************************************************/
/*                                                                   */
/* PART P - SDS PERSONALITY TRAITS                                 */
/*                                                                   */
/*********************************************************************/


/*--------------------------------------------------------------------*/
/* 29. SAFE SDS VARIABLE NAMES                                      */
/*                                                                    */
/* Actual source has leading space before extraversion.              */
/*--------------------------------------------------------------------*/

data work.sds_base;

    set work.sds_raw;


    extraversion_clean =
        ' extraversion'n;


    success_target =
        'success_ classification_ high_low'n;

run;


/*--------------------------------------------------------------------*/
/* 30. SDS PROFILE                                                  */
/*--------------------------------------------------------------------*/

title "SDS Personality Statistics";

proc means

    data=work.sds_base

    n
    nmiss
    mean
    median
    std
    min
    q1
    q3
    max;

    var

        neuroticism
        extraversion_clean
        openness_to_experience
        agreeableness
        conscientiousness;

run;


/*--------------------------------------------------------------------*/
/* 31. SDS CLASS BALANCE                                            */
/*--------------------------------------------------------------------*/

proc freq

    data=work.sds_base

    noprint;

    tables success_target /

        out=work.sds_class;

run;


title "SDS - Senior Success Class Balance";

proc sgplot

    data=work.sds_class;

    vbar success_target /

        response=count

        datalabel;

    yaxis
        label="Senior Data Scientists"
        grid;

run;


/*--------------------------------------------------------------------*/
/* 32. SDS OUTLIER VISUALS                                          */
/*--------------------------------------------------------------------*/

title "SDS - Neuroticism";

proc sgplot data=work.sds_base;

    vbox neuroticism;

    yaxis
        label="Neuroticism";

run;


title "SDS - Extraversion";

proc sgplot data=work.sds_base;

    vbox extraversion_clean;

    yaxis
        label="Extraversion";

run;


title "SDS - Openness";

proc sgplot data=work.sds_base;

    vbox openness_to_experience;

    yaxis
        label="Openness to Experience";

run;


title "SDS - Agreeableness";

proc sgplot data=work.sds_base;

    vbox agreeableness;

    yaxis
        label="Agreeableness";

run;


title "SDS - Conscientiousness";

proc sgplot data=work.sds_base;

    vbox conscientiousness;

    yaxis
        label="Conscientiousness";

run;


/*********************************************************************/
/*                                                                   */
/* PART Q - SDS TRAIN / TEST                                       */
/*                                                                   */
/*********************************************************************/


proc sort

    data=work.sds_base

    out=work.sds_sorted;

    by success_target;

run;


proc surveyselect

    data=work.sds_sorted

    out=work.sds_sample

    samprate=0.80

    seed=&seed

    method=srs

    outall;

    strata success_target;

run;


data work.sds_train
     work.sds_test;

    set work.sds_sample;


    if selected=1

    then

        output work.sds_train;

    else

        output work.sds_test;

run;


/*--------------------------------------------------------------------*/
/* 33. SDS RANDOMIZED STRATIFIED FOLDS                             */
/*--------------------------------------------------------------------*/

%make_folds(

    input=work.sds_train,

    target=success_target,

    output=work.sds_cv

);


/*--------------------------------------------------------------------*/
/* 34. SDS GRID RESULTS                                            */
/*--------------------------------------------------------------------*/

data work.sds_grid_results;

    length

        config $20
        fold 8
        cutoff 8
        accuracy 8
        precision 8
        recall 8
        specificity 8
        f1 8
        balanced_accuracy 8;

    stop;

run;


/* S1 = ALL FIVE TRAITS */

%run_cv(

    data=work.sds_train,

    target=success_target,

    folds=work.sds_cv,

    config=S1,

    cutoff=0.40,

    predictors=
        neuroticism
        extraversion_clean
        openness_to_experience
        agreeableness
        conscientiousness,

    classvars=,

    weightvar=,

    results=work.sds_grid_results

);


%run_cv(

    data=work.sds_train,

    target=success_target,

    folds=work.sds_cv,

    config=S1,

    cutoff=0.50,

    predictors=
        neuroticism
        extraversion_clean
        openness_to_experience
        agreeableness
        conscientiousness,

    classvars=,

    weightvar=,

    results=work.sds_grid_results

);


%run_cv(

    data=work.sds_train,

    target=success_target,

    folds=work.sds_cv,

    config=S1,

    cutoff=0.60,

    predictors=
        neuroticism
        extraversion_clean
        openness_to_experience
        agreeableness
        conscientiousness,

    classvars=,

    weightvar=,

    results=work.sds_grid_results

);


/* S2 = NON-NEUROTICISM TRAITS */

%run_cv(

    data=work.sds_train,

    target=success_target,

    folds=work.sds_cv,

    config=S2,

    cutoff=0.40,

    predictors=
        extraversion_clean
        openness_to_experience
        agreeableness
        conscientiousness,

    classvars=,

    weightvar=,

    results=work.sds_grid_results

);


%run_cv(

    data=work.sds_train,

    target=success_target,

    folds=work.sds_cv,

    config=S2,

    cutoff=0.50,

    predictors=
        extraversion_clean
        openness_to_experience
        agreeableness
        conscientiousness,

    classvars=,

    weightvar=,

    results=work.sds_grid_results

);


%run_cv(

    data=work.sds_train,

    target=success_target,

    folds=work.sds_cv,

    config=S2,

    cutoff=0.60,

    predictors=
        extraversion_clean
        openness_to_experience
        agreeableness
        conscientiousness,

    classvars=,

    weightvar=,

    results=work.sds_grid_results

);


/* S3 */

%run_cv(

    data=work.sds_train,

    target=success_target,

    folds=work.sds_cv,

    config=S3,

    cutoff=0.40,

    predictors=
        neuroticism
        extraversion_clean
        openness_to_experience
        conscientiousness,

    classvars=,

    weightvar=,

    results=work.sds_grid_results

);


%run_cv(

    data=work.sds_train,

    target=success_target,

    folds=work.sds_cv,

    config=S3,

    cutoff=0.50,

    predictors=
        neuroticism
        extraversion_clean
        openness_to_experience
        conscientiousness,

    classvars=,

    weightvar=,

    results=work.sds_grid_results

);


%run_cv(

    data=work.sds_train,

    target=success_target,

    folds=work.sds_cv,

    config=S3,

    cutoff=0.60,

    predictors=
        neuroticism
        extraversion_clean
        openness_to_experience
        conscientiousness,

    classvars=,

    weightvar=,

    results=work.sds_grid_results

);


/*--------------------------------------------------------------------*/
/* 35. SDS GRID SUMMARY                                            */
/*--------------------------------------------------------------------*/

proc sql;

    create table work.sds_grid_summary as

    select

        config,

        cutoff,

        mean(accuracy)
            as cv_accuracy format=8.4,

        mean(f1)
            as cv_f1 format=8.4,

        mean(balanced_accuracy)
            as cv_balanced_accuracy format=8.4

    from work.sds_grid_results

    group by
        config,
        cutoff

    order by
        cv_f1 desc;

quit;


title "SDS - Grid Search Results";

proc print

    data=work.sds_grid_summary

    noobs;

run;


/*********************************************************************/
/*                                                                   */
/* PART R - SDS RANDOMIZED SEARCH                                  */
/*                                                                   */
/*********************************************************************/


data work.sds_random_configs;

    if _n_=1

    then

        call streaminit(&seed);


    do iteration=1 to 8;

        model_number=
            rand(
                "integer",
                1,
                3
            );


        threshold_number=
            rand(
                "integer",
                1,
                3
            );


        if threshold_number=1

        then cutoff=0.40;

        else if threshold_number=2

        then cutoff=0.50;

        else cutoff=0.60;


        output;

    end;


    drop threshold_number;

run;


data work.sds_random_results;

    length

        config $20
        fold 8
        cutoff 8
        accuracy 8
        precision 8
        recall 8
        specificity 8
        f1 8
        balanced_accuracy 8;

    stop;

run;


%macro sds_random_search;


    %do iteration=1 %to 8;


        data _null_;

            set work.sds_random_configs(

                firstobs=&iteration
                obs=&iteration

            );


            call symputx(
                "sm",
                model_number
            );


            call symputx(
                "sc",
                cutoff
            );

        run;


        %if &sm=1 %then %do;

            %let sconfig=RS1;

            %let spred=
                neuroticism
                extraversion_clean
                openness_to_experience
                agreeableness
                conscientiousness;

        %end;


        %else %if &sm=2 %then %do;

            %let sconfig=RS2;

            %let spred=
                extraversion_clean
                openness_to_experience
                agreeableness
                conscientiousness;

        %end;


        %else %do;

            %let sconfig=RS3;

            %let spred=
                neuroticism
                extraversion_clean
                openness_to_experience
                conscientiousness;

        %end;


        %run_cv(

            data=work.sds_train,

            target=success_target,

            folds=work.sds_cv,

            config=&sconfig,

            cutoff=&sc,

            predictors=&spred,

            classvars=,

            weightvar=,

            results=work.sds_random_results

        );


    %end;


%mend;


%sds_random_search;


/*--------------------------------------------------------------------*/
/* 36. SDS RANDOMIZED SEARCH SUMMARY                               */
/*--------------------------------------------------------------------*/

proc sql;

    create table work.sds_random_summary as

    select

        config,

        cutoff,

        mean(accuracy)
            as cv_accuracy format=8.4,

        mean(f1)
            as cv_f1 format=8.4,

        mean(balanced_accuracy)
            as cv_balanced_accuracy format=8.4

    from work.sds_random_results

    group by
        config,
        cutoff

    order by
        cv_f1 desc;

quit;


title "SDS - Randomized Search Results";

proc print

    data=work.sds_random_summary

    noobs;

run;


/*********************************************************************/
/*                                                                   */
/* PART S - FINAL MODEL SELECTION FUNCTIONS                          */
/*                                                                   */
/*********************************************************************/


/*--------------------------------------------------------------------*/
/* Macro to fit final Analytics model                                */
/*--------------------------------------------------------------------*/

%macro final_analytics_model;

    proc sql noprint;

        select
            config,
            cutoff

        into
            :final_an_config,
            :final_an_cutoff

        from
            work.analytics_random_summary(obs=1);

    quit;


    %if &final_an_config=R1 %then %do;

        %let final_an_predictors=
            experience_cap
            role_group;

        %let final_an_class=
            role_group;

    %end;


    %else %if &final_an_config=R2 %then %do;

        %let final_an_predictors=
            experience_cap
            role_group
            location_group;

        %let final_an_class=
            role_group
            location_group;

    %end;


    %else %do;

        %let final_an_predictors=
            experience_cap
            role_group
            location_group
            skill_count_cap
            python_flag
            sql_flag
            machine_learning_flag
            tableau_flag
            powerbi_flag
            sas_flag;

        %let final_an_class=
            role_group
            location_group;

    %end;


    proc logistic

        data=work.analytics_train

        outmodel=project.analytics_high_salary_model;


        class
            &final_an_class
            / param=ref;


        model

            high_salary(event="1")

            =

            &final_an_predictors;


        weight class_weight;

    run;


    proc logistic

        inmodel=project.analytics_high_salary_model

        noprint;


        score

            data=work.analytics_test

            out=work.analytics_test_scored;

    run;


    data work.analytics_test_predictions;

        set work.analytics_test_scored;


        predicted_probability=P_1;


        if
            predicted_probability >=
            &final_an_cutoff

        then

            predicted_class=1;

        else

            predicted_class=0;

    run;

%mend;


/*--------------------------------------------------------------------*/
/* 37. RUN FINAL ANALYTICS MODEL                                    */
/*--------------------------------------------------------------------*/

%final_analytics_model;


/*--------------------------------------------------------------------*/
/* 38. ANALYTICS FINAL METRICS                                     */
/*--------------------------------------------------------------------*/

proc sql;

    create table work.analytics_final_metrics as

    select

        mean(
            predicted_class =
            high_salary
        )
            as accuracy,

        sum(
            predicted_class=1
            and
            high_salary=1
        )
            as tp,

        sum(
            predicted_class=0
            and
            high_salary=0
        )
            as tn,

        sum(
            predicted_class=1
            and
            high_salary=0
        )
            as fp,

        sum(
            predicted_class=0
            and
            high_salary=1
        )
            as fn

    from
        work.analytics_test_predictions;

quit;


data work.analytics_final_metrics;

    set work.analytics_final_metrics;


    precision=
        tp /
        max(
            tp+fp,
            1
        );


    recall=
        tp /
        max(
            tp+fn,
            1
        );


    specificity=
        tn /
        max(
            tn+fp,
            1
        );


    f1=
        2*precision*recall /
        max(
            precision+recall,
            .000001
        );


    balanced_accuracy=
        (recall+specificity)/2;

run;


title "FINAL ANALYTICS HIGH-SALARY MODEL";

proc print
    data=work.analytics_final_metrics
    noobs;

    format
        accuracy
        precision
        recall
        specificity
        f1
        balanced_accuracy
        8.4;

run;


/*--------------------------------------------------------------------*/
/* 39. ANALYTICS CONFUSION MATRIX                                  */
/*--------------------------------------------------------------------*/

title "Analytics - Confusion Matrix";

proc freq

    data=work.analytics_test_predictions;

    tables
        high_salary *
        predicted_class;

run;


/*********************************************************************/
/*                                                                   */
/* PART T - FINAL JDS MODEL                                         */
/*                                                                   */
/*********************************************************************/


%macro final_jds_model;

    proc sql noprint;

        select
            config,
            cutoff

        into
            :final_jds_config,
            :final_jds_cutoff

        from
            work.jds_random_summary(obs=1);

    quit;


    %if &final_jds_config=RJ1 %then %do;

        %let final_jds_predictors=
            big_data_skills
            maths_stats_skills
            coding_skills
            ai_and_ml_skills
            dashboard_and_storytelling_skills;

    %end;


    %else %if &final_jds_config=RJ2 %then %do;

        %let final_jds_predictors=
            maths_stats_skills
            coding_skills
            ai_and_ml_skills;

    %end;


    %else %do;

        %let final_jds_predictors=
            big_data_skills
            maths_stats_skills
            coding_skills
            ai_and_ml_skills;

    %end;


    proc logistic

        data=work.jds_train

        outmodel=project.jds_salary_hike_model;


        model

            salary_hike_target(event="1")

            =

            &final_jds_predictors;

    run;


    proc logistic

        inmodel=project.jds_salary_hike_model

        noprint;


        score

            data=work.jds_test

            out=work.jds_test_scored;

    run;


    data work.jds_test_predictions;

        set work.jds_test_scored;


        predicted_probability=P_1;


        if
            predicted_probability >=
            &final_jds_cutoff

        then

            predicted_class=1;

        else

            predicted_class=0;

    run;

%mend;


/*--------------------------------------------------------------------*/
/* 40. RUN FINAL JDS MODEL                                          */
/*--------------------------------------------------------------------*/

%final_jds_model;


/*--------------------------------------------------------------------*/
/* 41. JDS FINAL METRICS                                           */
/*--------------------------------------------------------------------*/

proc sql;

    create table work.jds_final_metrics as

    select

        mean(
            predicted_class =
            salary_hike_target
        )
            as accuracy,

        sum(
            predicted_class=1
            and
            salary_hike_target=1
        )
            as tp,

        sum(
            predicted_class=0
            and
            salary_hike_target=0
        )
            as tn,

        sum(
            predicted_class=1
            and
            salary_hike_target=0
        )
            as fp,

        sum(
            predicted_class=0
            and
            salary_hike_target=1
        )
            as fn

    from
        work.jds_test_predictions;

quit;


data work.jds_final_metrics;

    set work.jds_final_metrics;


    precision=
        tp /
        max(
            tp+fp,
            1
        );


    recall=
        tp /
        max(
            tp+fn,
            1
        );


    specificity=
        tn /
        max(
            tn+fp,
            1
        );


    f1=
        2*precision*recall /
        max(
            precision+recall,
            .000001
        );


    balanced_accuracy=
        (recall+specificity)/2;

run;


title "FINAL JDS SALARY-HIKE MODEL";

proc print

    data=work.jds_final_metrics

    noobs;

    format
        accuracy
        precision
        recall
        specificity
        f1
        balanced_accuracy
        8.4;

run;


/*--------------------------------------------------------------------*/
/* 42. JDS CONFUSION MATRIX                                        */
/*--------------------------------------------------------------------*/

title "JDS - Confusion Matrix";

proc freq

    data=work.jds_test_predictions;

    tables
        salary_hike_target *
        predicted_class;

run;


/*********************************************************************/
/*                                                                   */
/* PART U - FINAL SDS MODEL                                         */
/*                                                                   */
/*********************************************************************/


%macro final_sds_model;


    proc sql noprint;

        select
            config,
            cutoff

        into
            :final_sds_config,
            :final_sds_cutoff

        from
            work.sds_random_summary(obs=1);

    quit;


    %if &final_sds_config=RS1 %then %do;

        %let final_sds_predictors=
            neuroticism
            extraversion_clean
            openness_to_experience
            agreeableness
            conscientiousness;

    %end;


    %else %if &final_sds_config=RS2 %then %do;

        %let final_sds_predictors=
            extraversion_clean
            openness_to_experience
            agreeableness
            conscientiousness;

    %end;


    %else %do;

        %let final_sds_predictors=
            neuroticism
            extraversion_clean
            openness_to_experience
            conscientiousness;

    %end;


    proc logistic

        data=work.sds_train

        outmodel=project.sds_success_model;


        model

            success_target(event="1")

            =

            &final_sds_predictors;

    run;


    proc logistic

        inmodel=project.sds_success_model

        noprint;


        score

            data=work.sds_test

            out=work.sds_test_scored;

    run;


    data work.sds_test_predictions;

        set work.sds_test_scored;


        predicted_probability=P_1;


        if
            predicted_probability >=
            &final_sds_cutoff

        then

            predicted_class=1;

        else

            predicted_class=0;

    run;

%mend;


/*--------------------------------------------------------------------*/
/* 43. RUN FINAL SDS MODEL                                          */
/*--------------------------------------------------------------------*/

%final_sds_model;


/*--------------------------------------------------------------------*/
/* 44. SDS FINAL METRICS                                           */
/*--------------------------------------------------------------------*/

proc sql;

    create table work.sds_final_metrics as

    select

        mean(
            predicted_class =
            success_target
        )
            as accuracy,

        sum(
            predicted_class=1
            and
            success_target=1
        )
            as tp,

        sum(
            predicted_class=0
            and
            success_target=0
        )
            as tn,

        sum(
            predicted_class=1
            and
            success_target=0
        )
            as fp,

        sum(
            predicted_class=0
            and
            success_target=1
        )
            as fn

    from
        work.sds_test_predictions;

quit;


data work.sds_final_metrics;

    set work.sds_final_metrics;


    precision=
        tp /
        max(
            tp+fp,
            1
        );


    recall=
        tp /
        max(
            tp+fn,
            1
        );


    specificity=
        tn /
        max(
            tn+fp,
            1
        );


    f1=
        2*precision*recall /
        max(
            precision+recall,
            .000001
        );


    balanced_accuracy=
        (recall+specificity)/2;

run;


title "FINAL SDS SENIOR-SUCCESS MODEL";

proc print

    data=work.sds_final_metrics

    noobs;

    format
        accuracy
        precision
        recall
        specificity
        f1
        balanced_accuracy
        8.4;

run;


/*--------------------------------------------------------------------*/
/* 45. SDS CONFUSION MATRIX                                        */
/*--------------------------------------------------------------------*/

title "SDS - Confusion Matrix";

proc freq

    data=work.sds_test_predictions;

    tables
        success_target *
        predicted_class;

run;


/*********************************************************************/
/*                                                                   */
/* PART V - ACTUAL VS PREDICTED GRAPHS                              */
/*                                                                   */
/*********************************************************************/


/*--------------------------------------------------------------------*/
/* ANALYTICS                                                        */
/*--------------------------------------------------------------------*/

proc freq

    data=work.analytics_test_predictions

    noprint;

    tables
        high_salary *
        predicted_class

        /

        out=work.analytics_actual_pred;

run;


title "Analytics - Actual vs Predicted High Salary";

proc sgplot

    data=work.analytics_actual_pred;

    vbar predicted_class /

        response=count

        group=high_salary

        groupdisplay=cluster

        datalabel;

    yaxis
        label="Records"
        grid;

    xaxis
        label="Predicted Class";

run;


/*--------------------------------------------------------------------*/
/* JDS                                                              */
/*--------------------------------------------------------------------*/

proc freq

    data=work.jds_test_predictions

    noprint;

    tables
        salary_hike_target *
        predicted_class

        /

        out=work.jds_actual_pred;

run;


title "JDS - Actual vs Predicted Salary Hike";

proc sgplot

    data=work.jds_actual_pred;

    vbar predicted_class /

        response=count

        group=salary_hike_target

        groupdisplay=cluster

        datalabel;

    yaxis
        label="Records"
        grid;

    xaxis
        label="Predicted Class";

run;


/*--------------------------------------------------------------------*/
/* SDS                                                              */
/*--------------------------------------------------------------------*/

proc freq

    data=work.sds_test_predictions

    noprint;

    tables
        success_target *
        predicted_class

        /

        out=work.sds_actual_pred;

run;


title "SDS - Actual vs Predicted Senior Success";

proc sgplot

    data=work.sds_actual_pred;

    vbar predicted_class /

        response=count

        group=success_target

        groupdisplay=cluster

        datalabel;

    yaxis
        label="Records"
        grid;

    xaxis
        label="Predicted Class";

run;


/*********************************************************************/
/*                                                                   */
/* PART W - MASTER MODEL SUMMARY                                    */
/*                                                                   */
/*********************************************************************/


data work.master_model_summary;

    length

        dataset $30
        target_description $40;


    set

        work.analytics_final_metrics
            (in=an)

        work.jds_final_metrics
            (in=jds)

        work.sds_final_metrics
            (in=sds);


    if an then do;

        dataset=
            "Analytics Jobs";

        target_description=
            "High Salary Band";

    end;


    else if jds then do;

        dataset=
            "JDS Skill Traits";

        target_description=
            "High Salary Hike";

    end;


    else if sds then do;

        dataset=
            "SDS Personality Traits";

        target_description=
            "High Senior Success";

    end;

run;


title "MASTER MODEL PERFORMANCE";

proc print

    data=work.master_model_summary

    noobs;

    var

        dataset
        target_description
        accuracy
        precision
        recall
        specificity
        f1
        balanced_accuracy;

    format

        accuracy
        precision
        recall
        specificity
        f1
        balanced_accuracy
        8.4;

run;


/*********************************************************************/
/*                                                                   */
/* PART X - SAVED MODEL VERIFICATION                               */
/*                                                                   */
/*********************************************************************/


title "Saved Analytics Model";

proc contents

    data=project.analytics_high_salary_model;

run;


title "Saved JDS Model";

proc contents

    data=project.jds_salary_hike_model;

run;


title "Saved SDS Model";

proc contents

    data=project.sds_success_model;

run;


/*********************************************************************/
/*                                                                   */
/* FINAL                                                             */
/*                                                                   */
/*********************************************************************/

title "SAS CU HACKATHON - INTEGRATED PIPELINE COMPLETE";